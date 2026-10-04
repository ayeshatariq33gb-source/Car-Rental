import { Router } from 'express'
import { uploadDrivingLicense } from '../controllers/licenseController.js'
import { getProfile, updatePassword, updateProfile } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import licenseUpload from '../middleware/licenseUpload.js'
import asyncHandler from '../middleware/asyncHandler.js'

const router = Router()
router.use(protect)
router.get('/profile', asyncHandler(getProfile))
router.put('/profile', asyncHandler(updateProfile))
router.put('/profile/password', asyncHandler(updatePassword))
router.post('/profile/driving-license', licenseUpload.single('license'), asyncHandler(uploadDrivingLicense))
export default router
