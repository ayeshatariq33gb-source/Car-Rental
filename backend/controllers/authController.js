import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

export const register = async (req, res) => {
  const { name, phone, password } = req.body
  const email = String(req.body.email).trim().toLowerCase()
  const exists = await User.findOne({ email })
  if (exists) return res.status(409).json({ message: 'Email is already registered' })
  const user = await User.create({ name, email, phone, password, role: 'user' })
  res.status(201).json({ token: createToken(user), user: user.toSafeObject() })
}

export const login = async (req, res) => {
  const { password } = req.body
  const email = String(req.body.email).trim().toLowerCase()
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' })
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated' })
  res.json({ token: createToken(user), user: user.toSafeObject() })
}
