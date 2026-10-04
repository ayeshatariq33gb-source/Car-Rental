import Booking from '../models/Booking.js'
import Car from '../models/Car.js'
import Stripe from 'stripe'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import mongoose from 'mongoose'

export const getDashboard = async (req, res) => {
  const [users, bookings, activeRentals, availableCars, revenue] = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'active' }),
    Car.countDocuments({ available: true, maintenance: false }),
    Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
  ])
  const paidBookings = await Booking.countDocuments({ paymentStatus: 'paid' })
  res.json({ stats: { users, bookings, activeRentals, availableCars, paidBookings, revenue: revenue[0]?.total || 0 } })
}

export const getUsers = async (req, res) => res.json({ users: await User.find().select('-password').sort({ createdAt: -1 }) })
export const getBookings = async (req, res) => res.json({ bookings: await Booking.find().populate('user', 'name email').populate('car').sort({ createdAt: -1 }) })
export const getPaidBookings = async (req, res) => res.json({ bookings: await Booking.find({ paymentStatus: 'paid' }).populate('user', 'name email').populate('car').sort({ paidAt: -1 }) })
export const getTransactions = async (req, res) => res.json({ transactions: await Transaction.find().populate('user', 'name email').populate({ path: 'booking', populate: { path: 'car', select: 'name' } }).sort({ createdAt: -1 }) })

export const updateUserStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' })
  if (req.params.id === String(req.user._id)) return res.status(409).json({ message: 'You cannot deactivate your own account' })
  if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false' })
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'user' }, { isActive: req.body.isActive }, { new: true }).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ user })
}

export const reviewDrivingLicense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' })
  const { status, rejectionReason = '' } = req.body
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Choose approved or rejected' })
  const user = await User.findOne({ _id: req.params.id, role: 'user' }).select('+drivingLicense.storageName')
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (!user.drivingLicense?.storageName) return res.status(409).json({ message: 'User has not submitted a driving license' })
  user.drivingLicense.status = status
  user.drivingLicense.rejectionReason = status === 'rejected' ? String(rejectionReason).trim().slice(0, 300) : ''
  user.drivingLicense.reviewedAt = new Date()
  await user.save()
  res.json({ user: user.toSafeObject() })
}

export const updateBookingStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  const allowed = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected']
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid booking status' })
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email').populate('car')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  res.json({ booking })
}

export const resolveBookingChange = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Choose approved or rejected' })
  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.changeRequest?.status !== 'pending') return res.status(409).json({ message: 'There is no pending change request' })
  if (req.body.status === 'approved' && booking.changeRequest.kind === 'reschedule') {
    const conflict = await Booking.exists({
      _id: { $ne: booking._id },
      car: booking.car,
      status: { $in: ['pending', 'confirmed', 'active'] },
      pickupDate: { $lt: booking.changeRequest.returnDate },
      returnDate: { $gt: booking.changeRequest.pickupDate },
    })
    if (conflict) return res.status(409).json({ message: 'Car is no longer available for the requested dates' })
    const car = await Car.findById(booking.car).select('price')
    if (!car) return res.status(404).json({ message: 'Car not found' })
    const rescheduledTotal = Math.ceil((booking.changeRequest.returnDate - booking.changeRequest.pickupDate) / 86400000) * car.price
    if (booking.paymentStatus === 'paid' && Math.abs(rescheduledTotal - booking.totalPrice) > 0.01) {
      return res.status(409).json({ message: 'The requested dates change the paid total. Refund and rebook this trip to keep accounting accurate.' })
    }
    booking.pickupDate = booking.changeRequest.pickupDate
    booking.returnDate = booking.changeRequest.returnDate
    booking.totalPrice = rescheduledTotal
    if (booking.paymentStatus !== 'paid') await Transaction.updateMany({ booking: booking._id, status: 'pending' }, { amount: rescheduledTotal })
  }
  if (req.body.status === 'approved' && booking.changeRequest.kind === 'cancellation') booking.status = 'cancelled'
  booking.changeRequest.status = req.body.status
  booking.changeRequest.reviewedAt = new Date()
  await booking.save()
  await booking.populate('user', 'name email')
  await booking.populate('car')
  res.json({ booking })
}

export const refundTransaction = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid transaction id' })
  const transaction = await Transaction.findById(req.params.id)
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' })
  if (transaction.status !== 'received') return res.status(409).json({ message: 'Only received payments can be refunded' })
  const refundReason = String(req.body.reason || '').trim().slice(0, 500)
  if (transaction.method === 'stripe') {
    if (!process.env.STRIPE_SECRET_KEY || !transaction.providerPaymentIntentId) return res.status(503).json({ message: 'Stripe refund is not configured for this transaction' })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    await stripe.refunds.create({ payment_intent: transaction.providerPaymentIntentId, reason: 'requested_by_customer' }, { idempotencyKey: `rental-refund-${transaction._id}` })
  }
  transaction.status = 'refunded'
  transaction.refundReason = refundReason
  transaction.refundedBy = req.user._id
  transaction.refundedAt = new Date()
  await transaction.save()
  await Booking.updateOne({ _id: transaction.booking }, { paymentStatus: 'refunded' })
  res.json({ transaction })
}

export const markTransactionReceived = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid transaction id' })
  const transaction = await Transaction.findById(req.params.id)
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' })
  if (transaction.method === 'stripe') return res.status(409).json({ message: 'Stripe payments are reconciled by webhook' })
  if (transaction.status !== 'pending') return res.status(409).json({ message: 'Only pending payments can be marked received' })
  transaction.status = 'received'
  transaction.paidAt = new Date()
  await transaction.save()
  await Booking.updateOne({ _id: transaction.booking }, { paymentStatus: 'paid', paidAt: transaction.paidAt })
  res.json({ transaction })
}
