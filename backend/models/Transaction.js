import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd', lowercase: true },
  method: { type: String, enum: ['stripe', 'cash', 'local'], required: true },
  status: { type: String, enum: ['pending', 'received', 'refunded', 'failed'], default: 'pending' },
  providerSessionId: { type: String, unique: true, sparse: true },
  providerPaymentIntentId: { type: String, index: true },
  refundReason: { type: String, maxlength: 500, default: '' },
  refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date },
  refundedAt: { type: Date },
}, { timestamps: true })

transactionSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Transaction', transactionSchema)
