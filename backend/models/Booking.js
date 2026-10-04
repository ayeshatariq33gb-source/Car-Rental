import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  pickupLocation: { type: String, required: true, trim: true },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'deposit_pending', 'paid', 'refunded'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['card', 'stripe', 'cash'] },
  cardLast4: { type: String, match: /^\d{4}$/ },
  paidAt: { type: Date },
  reservationExpiresAt: { type: Date },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 1200, trim: true },
    submittedAt: { type: Date },
  },
  changeRequest: {
    kind: { type: String, enum: ['cancellation', 'reschedule'] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    pickupDate: { type: Date },
    returnDate: { type: Date },
    message: { type: String, maxlength: 500, trim: true },
    requestedAt: { type: Date },
    reviewedAt: { type: Date },
  },
}, { timestamps: true })

bookingSchema.index({ car: 1, pickupDate: 1, returnDate: 1 })

export default mongoose.model('Booking', bookingSchema)
