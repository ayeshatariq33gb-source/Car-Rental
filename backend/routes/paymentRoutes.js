import { Router } from 'express'
import { createCheckout, getMyTransactions } from '../controllers/paymentController.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()
router.use(protect)
router.post('/checkout', asyncHandler(createCheckout))
router.get('/my-transactions', asyncHandler(getMyTransactions))
export default router
