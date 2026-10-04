import { Router } from 'express'
import { getBookings, getDashboard, getPaidBookings, getTransactions, getUsers, markTransactionReceived, refundTransaction, resolveBookingChange, reviewDrivingLicense, updateBookingStatus, updateUserStatus } from '../controllers/adminController.js'
import { getDrivingLicense } from '../controllers/licenseController.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = Router()
router.use(protect, adminOnly)
router.get('/dashboard', asyncHandler(getDashboard))
router.get('/users', asyncHandler(getUsers))
router.get('/bookings', asyncHandler(getBookings))
router.get('/paid-bookings', asyncHandler(getPaidBookings))
router.get('/transactions', asyncHandler(getTransactions))
router.get('/users/:id/license', asyncHandler(getDrivingLicense))
router.patch('/users/:id/status', asyncHandler(updateUserStatus))
router.patch('/users/:id/license', asyncHandler(reviewDrivingLicense))
router.patch('/bookings/:id/status', asyncHandler(updateBookingStatus))
router.patch('/bookings/:id/change-request', asyncHandler(resolveBookingChange))
router.patch('/transactions/:id/received', asyncHandler(markTransactionReceived))
router.patch('/transactions/:id/refund', asyncHandler(refundTransaction))
export default router
