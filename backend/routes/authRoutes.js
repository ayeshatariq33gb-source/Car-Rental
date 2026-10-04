import { Router } from 'express'
import { login, register } from '../controllers/authController.js'
import { required } from '../middleware/validate.js'

const router = Router()
router.post('/register', required('name', 'email', 'phone', 'password'), register)
router.post('/login', required('email', 'password'), login)
export default router
