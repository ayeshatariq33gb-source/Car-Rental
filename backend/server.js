import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import morgan from 'morgan'
import paymentRoutes from './routes/paymentRoutes.js'
import { stripeWebhook } from './controllers/paymentController.js'
import connectDB from './config/db.js'
import User from './models/User.js'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import carRoutes from './routes/carRoutes.js'
import userRoutes from './routes/userRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') })

const app = express()
const port = process.env.PORT || 5000
const allowedClientOrigins = process.env.CLIENT_URL?.split(',').map((url) => url.trim()).filter(Boolean) || []

app.use(cors({ origin: (origin, callback) => {
  const localDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '')
  callback(null, !origin || !allowedClientOrigins.length || allowedClientOrigins.includes(origin) || localDevelopmentOrigin)
} }))
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'roam-rental-api' }))
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cars', carRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/content', contentRoutes)
app.use(notFound)
app.use(errorHandler)

const createInitialAdmin = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() })
  if (exists) return
  await User.create({ name: process.env.ADMIN_NAME || 'Roam Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' })
  console.log(`Initial admin created for ${process.env.ADMIN_EMAIL}`)
}

const startServer = async () => {
  try {
    await connectDB()
    await createInitialAdmin()
    app.listen(port, () => console.log(`API running on http://localhost:${port}`))
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`)
    process.exit(1)
  }
}

startServer()

export default app
