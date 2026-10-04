import User from '../models/User.js'

export const getProfile = async (req, res) => {
  res.json({ user: req.user.toSafeObject() })
}

export const updateProfile = async (req, res) => {
  const { name, phone } = req.body
  if (name !== undefined) req.user.name = name
  if (phone !== undefined) req.user.phone = phone
  if (req.body.email !== undefined) req.user.email = String(req.body.email).trim().toLowerCase()
  const user = await req.user.save()
  res.json({ user: user.toSafeObject() })
}

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Enter your current password and a new password of at least 8 characters' })
  }
  const user = await User.findById(req.user._id).select('+password')
  if (!user || !(await user.comparePassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' })
  user.password = newPassword
  await user.save()
  res.json({ message: 'Password updated successfully' })
}
