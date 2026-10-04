import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import User from '../models/User.js'

const backendDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const uploadDirectory = () => path.resolve(process.env.LICENSE_UPLOAD_DIR || path.join(backendDirectory, 'private-uploads', 'licenses'))

const detectDocument = (buffer) => {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return '.pdf'
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return '.jpg'
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png'
  return null
}

const removeStoredFile = async (storageName) => {
  if (!storageName || path.basename(storageName) !== storageName) return
  await unlink(path.join(uploadDirectory(), storageName)).catch(() => {})
}

export const uploadDrivingLicense = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a document to upload' })
  const extension = detectDocument(req.file.buffer)
  if (!extension) return res.status(400).json({ message: 'The file contents do not match a supported PDF, JPG, or PNG document' })

  const storageName = `${req.user._id}-${randomUUID()}${extension}`
  try {
    await mkdir(uploadDirectory(), { recursive: true })
    await writeFile(path.join(uploadDirectory(), storageName), req.file.buffer, { flag: 'wx', mode: 0o600 })
    const user = await User.findById(req.user._id).select('+drivingLicense.storageName')
    const previousFile = user.drivingLicense?.storageName
    user.drivingLicense = {
      fileName: path.basename(req.file.originalname).slice(0, 120),
      storageName,
      status: 'pending',
      rejectionReason: '',
      uploadedAt: new Date(),
      reviewedAt: undefined,
    }
    await user.save()
    await removeStoredFile(previousFile)
    res.status(201).json({ user: user.toSafeObject() })
  } catch (error) {
    await removeStoredFile(storageName)
    next(error)
  }
}

export const getDrivingLicense = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+drivingLicense.storageName')
    if (!user?.drivingLicense?.storageName) return res.status(404).json({ message: 'Driving license document not found' })
    const storageName = user.drivingLicense.storageName
    if (path.basename(storageName) !== storageName || !storageName.startsWith(`${user._id}-`)) {
      return res.status(404).json({ message: 'Driving license document not found' })
    }
    res.type(path.extname(storageName)).set('Content-Disposition', 'inline').sendFile(path.join(uploadDirectory(), storageName), (error) => {
      if (error && !res.headersSent) next(error)
    })
  } catch (error) {
    next(error)
  }
}
