import Stripe from 'stripe'
import Booking from '../models/Booking.js'
import Car from '../models/Car.js'
import Transaction from '../models/Transaction.js'
import mongoose from 'mongoose'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Card checkout is not configured. Set STRIPE_SECRET_KEY on the server.')
    error.statusCode = 503
    throw error
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '')

export const createCheckout = async (req, res, next) => {
  try {
    const { car: carId, pickupDate, returnDate, pickupLocation, method } = req.body
    if (!mongoose.isValidObjectId(carId)) return res.status(400).json({ message: 'Invalid car id' })
    if (!['stripe', 'cash'].includes(method)) return res.status(400).json({ message: 'Choose card or cash payment' })
    const pickup = new Date(pickupDate)
    const returning = new Date(returnDate)
    if (Number.isNaN(pickup.valueOf()) || Number.isNaN(returning.valueOf()) || returning <= pickup) {
      return res.status(400).json({ message: 'Return date must be after pickup date' })
    }
    if (!String(pickupLocation || '').trim()) return res.status(400).json({ message: 'Pick-up location is required' })

    const car = await Car.findById(carId)
    if (!car || !car.available || car.maintenance) return res.status(404).json({ message: 'Car is not available' })
    const conflict = await Booking.exists({
      car: carId,
      pickupDate: { $lt: returning },
      returnDate: { $gt: pickup },
      $or: [
        { status: { $in: ['confirmed', 'active'] } },
        { status: 'pending', $or: [{ paymentMethod: { $ne: 'stripe' } }, { reservationExpiresAt: { $gt: new Date() } }] },
      ],
    })
    if (conflict) return res.status(409).json({ message: 'Car is already booked for those dates' })

    const days = Math.ceil((returning - pickup) / 86400000)
    const amount = days * car.price
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'The booking total must be greater than zero' })

    const booking = await Booking.create({
      user: req.user._id,
      car: carId,
      pickupDate: pickup,
      returnDate: returning,
      pickupLocation: String(pickupLocation).trim(),
      totalPrice: amount,
      status: 'pending',
      paymentStatus: method === 'cash' ? 'deposit_pending' : 'unpaid',
      paymentMethod: method,
      ...(method === 'stripe' ? { reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000) } : {}),
    })
    let transaction
    try {
      transaction = await Transaction.create({
        booking: booking._id,
        user: req.user._id,
        amount,
        currency: String(process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
        method,
        status: 'pending',
      })
    } catch (error) {
      await Booking.updateOne({ _id: booking._id }, { $set: { status: 'cancelled' } })
      throw error
    }

    if (method === 'cash') {
      return res.status(201).json({ booking: await booking.populate('car'), transaction, checkoutUrl: null })
    }

    try {
      const nowSeconds = Math.floor(Date.now() / 1000)
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: transaction.currency,
            unit_amount: Math.round(amount * 100),
            product_data: { name: `${car.name} rental`, description: `${days} day(s), ${pickupLocation}` },
          },
          quantity: 1,
        }],
        success_url: `${clientUrl()}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl()}/profile?payment=cancelled`,
        expires_at: nowSeconds + 1800,
        metadata: { bookingId: String(booking._id), transactionId: String(transaction._id), userId: String(req.user._id) },
      })
      if (!session.url) throw new Error('Stripe did not return a checkout URL')
      transaction.providerSessionId = session.id
      await transaction.save()
      return res.status(201).json({ booking, transaction, checkoutUrl: session.url })
    } catch (error) {
      await Promise.all([
        Booking.updateOne({ _id: booking._id }, { $set: { status: 'cancelled' } }),
        Transaction.updateOne({ _id: transaction._id }, { $set: { status: 'failed' } }),
      ])
      throw error
    }
  } catch (error) {
    next(error)
  }
}

export const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).populate({
      path: 'booking',
      populate: { path: 'car', select: 'name image' },
    }).sort({ createdAt: -1 })
    res.json({ transactions })
  } catch (error) {
    next(error)
  }
}

export const stripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook is not configured')
  let event
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error.message}`)
  }

  try {
    const session = event.data.object
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      if (session.payment_status !== 'paid') return res.json({ received: true })
      let transaction = await Transaction.findOneAndUpdate(
        { providerSessionId: session.id, status: 'pending' },
        { $set: { status: 'received', providerPaymentIntentId: session.payment_intent, paidAt: new Date() } },
        { new: true },
      )
      if (!transaction) transaction = await Transaction.findOne({ providerSessionId: session.id, status: 'received' })
      if (transaction) {
        await Booking.updateOne(
          { _id: transaction.booking, status: { $nin: ['cancelled', 'rejected'] } },
          { $set: { status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'stripe', paidAt: new Date(), reservationExpiresAt: null } },
        )
      }
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const transaction = await Transaction.findOneAndUpdate(
        { providerSessionId: session.id, status: 'pending' },
        { $set: { status: 'failed' } },
        { new: true },
      )
      if (transaction) await Booking.updateOne({ _id: transaction.booking, status: 'pending' }, { $set: { status: 'cancelled' } })
    }
    res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook processing failed:', error)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
}
