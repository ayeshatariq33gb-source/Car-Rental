import Booking from '../models/Booking.js'
import Car from '../models/Car.js'
import mongoose from 'mongoose'

const validateDates = (pickupDate, returnDate) => {
  const pickup = new Date(pickupDate)
  const returning = new Date(returnDate)
  if (Number.isNaN(pickup.valueOf()) || Number.isNaN(returning.valueOf()) || returning <= pickup) return null
  return { pickup, returning }
}

const saveBooking = async (req, res) => {
  const { car: carId, pickupDate, returnDate, pickupLocation } = req.body
  if (!mongoose.isValidObjectId(carId)) return res.status(400).json({ message: 'Invalid car id' })
  const dates = validateDates(pickupDate, returnDate)
  if (!dates) return res.status(400).json({ message: 'Return date must be after pickup date' })
  const car = await Car.findById(carId)
  if (!car || !car.available || car.maintenance) return res.status(404).json({ message: 'Car is not available' })
  const conflict = await Booking.exists({
    car: carId,
    pickupDate: { $lt: dates.returning },
    returnDate: { $gt: dates.pickup },
    $or: [
      { status: { $in: ['confirmed', 'active'] } },
      { status: 'pending', $or: [{ paymentMethod: { $ne: 'stripe' } }, { reservationExpiresAt: { $gt: new Date() } }] },
    ],
  })
  if (conflict) return res.status(409).json({ message: 'Car is already booked for those dates' })
  const days = Math.ceil((dates.returning - dates.pickup) / 86400000)
  const booking = await Booking.create({
    user: req.user._id,
    car: carId,
    pickupDate: dates.pickup,
    returnDate: dates.returning,
    pickupLocation,
    totalPrice: days * car.price,
  })
  return res.status(201).json({ booking: await booking.populate('car') })
}

export const checkAvailability = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.carId)) return res.status(400).json({ message: 'Invalid car id' })
  const dates = validateDates(req.query.pickupDate, req.query.returnDate)
  if (!dates) return res.status(400).json({ message: 'Return date must be after pickup date' })
  const car = await Car.findById(req.params.carId).select('available maintenance')
  if (!car) return res.status(404).json({ message: 'Car not found' })
  const conflict = await Booking.exists({
    car: req.params.carId,
    pickupDate: { $lt: dates.returning },
    returnDate: { $gt: dates.pickup },
    $or: [
      { status: { $in: ['confirmed', 'active'] } },
      { status: 'pending', $or: [{ paymentMethod: { $ne: 'stripe' } }, { reservationExpiresAt: { $gt: new Date() } }] },
    ],
  })
  res.json({ available: Boolean(car.available) && !car.maintenance && !conflict, status: car.maintenance ? 'maintenance' : !car.available ? 'unavailable' : conflict ? 'already-booked' : 'available' })
}

export const createBooking = async (req, res) => {
  return saveBooking(req, res)
}

export const getMyBookings = async (req, res) => {
  res.json({ bookings: await Booking.find({ user: req.user._id }).populate('car').sort({ createdAt: -1 }) })
}

export const getBooking = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('car')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  res.json({ booking })
}

export const requestBookingChange = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  const { kind, pickupDate, returnDate, message = '' } = req.body
  if (!['cancellation', 'reschedule'].includes(kind)) return res.status(400).json({ message: 'Choose cancellation or reschedule' })
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!['pending', 'confirmed'].includes(booking.status)) return res.status(409).json({ message: 'This booking can no longer be changed' })
  if (booking.changeRequest?.status === 'pending') return res.status(409).json({ message: 'A booking change request is already pending' })

  let requestedDates = {}
  if (kind === 'reschedule') {
    const dates = validateDates(pickupDate, returnDate)
    if (!dates) return res.status(400).json({ message: 'Return date must be after pickup date' })
    const conflict = await Booking.exists({
      _id: { $ne: booking._id },
      car: booking.car,
      status: { $in: ['pending', 'confirmed', 'active'] },
      pickupDate: { $lt: dates.returning },
      returnDate: { $gt: dates.pickup },
    })
    if (conflict) return res.status(409).json({ message: 'Car is already booked for those dates' })
    requestedDates = { pickupDate: dates.pickup, returnDate: dates.returning }
  }

  booking.changeRequest = {
    kind,
    status: 'pending',
    ...requestedDates,
    message: String(message).trim().slice(0, 500),
    requestedAt: new Date(),
  }
  await booking.save()
  res.status(201).json({ booking: await booking.populate('car') })
}

export const submitBookingReview = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  const rating = Number(req.body.rating)
  const comment = String(req.body.comment || '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  if (comment.length > 1200) return res.status(400).json({ message: 'Review must be 1,200 characters or fewer' })
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.status !== 'completed') return res.status(409).json({ message: 'Reviews are available after the rental is completed' })
  if (booking.review?.submittedAt) return res.status(409).json({ message: 'A review has already been submitted for this booking' })
  booking.review = { rating, comment, submittedAt: new Date() }
  await booking.save()
  const [average] = await Booking.aggregate([
    { $match: { car: booking.car, 'review.submittedAt': { $exists: true } } },
    { $group: { _id: '$car', rating: { $avg: '$review.rating' } } },
  ])
  if (average) await Car.updateOne({ _id: booking.car }, { rating: Math.round(average.rating * 10) / 10 })
  res.json({ booking: await booking.populate('car') })
}

export const cancelBooking = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id' })
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!['pending', 'confirmed'].includes(booking.status)) return res.status(409).json({ message: 'This booking can no longer be cancelled' })
  booking.status = 'cancelled'
  await booking.save()
  res.json({ booking: await booking.populate('car') })
}
