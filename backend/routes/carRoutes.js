import { Router } from 'express'
import { createCar, deleteCar, getCar, getCars, updateCar } from '../controllers/carController.js'
import { checkAvailability } from '../controllers/bookingController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = Router()
router.get('/', getCars)
router.get('/:carId/availability', checkAvailability)
router.get('/:id', getCar)
router.post('/', protect, adminOnly, createCar)
router.put('/:id', protect, adminOnly, updateCar)
router.delete('/:id', protect, adminOnly, deleteCar)
export default router
