import multer from 'multer'

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])

export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Upload a PDF, JPG, or PNG document')
      error.statusCode = 400
      return callback(error)
    }
    callback(null, true)
  },
})
