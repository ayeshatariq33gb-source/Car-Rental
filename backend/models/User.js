import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  drivingLicense: {
    fileName: { type: String, default: '' },
    storageName: { type: String, default: '', select: false },
    status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
    rejectionReason: { type: String, default: '' },
    uploadedAt: { type: Date },
    reviewedAt: { type: Date },
  },
}, { timestamps: true })

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject()
  delete user.password
  if (user.drivingLicense) delete user.drivingLicense.storageName
  return user
}

export default mongoose.model('User', userSchema)
