import { Router } from 'express'
import { cancelBooking, createBooking, getBooking, getMyBookings, requestBookingChange, submitBookingReview } from '../controllers/bookingController.js'
import { protect } from '../middleware/authMiddleware.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { required } from '../middleware/validate.js'

const router = Router()
router.use(protect)
router.post('/', required('car', 'pickupDate', 'returnDate', 'pickupLocation'), asyncHandler(createBooking))
router.get('/my', asyncHandler(getMyBookings))
router.get('/:id', asyncHandler(getBooking))
router.post('/:id/change-request', asyncHandler(requestBookingChange))
router.post('/:id/review', asyncHandler(submitBookingReview))
router.patch('/:id/cancel', asyncHandler(cancelBooking))
export default router
