import { Router } from 'express'
import { addContentItem, deleteContentItem, getContent, updateContent, updateContentItem } from '../controllers/contentController.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = Router()
router.get('/', asyncHandler(getContent))
router.put('/', protect, adminOnly, asyncHandler(updateContent))
router.post('/items/:collection', protect, adminOnly, asyncHandler(addContentItem))
router.put('/items/:collection/:itemId', protect, adminOnly, asyncHandler(updateContentItem))
router.delete('/items/:collection/:itemId', protect, adminOnly, asyncHandler(deleteContentItem))

export default router
