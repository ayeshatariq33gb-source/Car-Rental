export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
  })
}

export const errorHandler = (error, req, res, _next) => {
  if (res.headersSent) return _next(error)
  console.error(error)
  const fallbackStatus = error.name === 'ValidationError' || error.name === 'MulterError' ? 400 : error.code === 11000 ? 409 : 500
  const candidateStatus = Number(error.statusCode || error.status)
  const statusCode = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 600 ? candidateStatus : fallbackStatus
  let message = 'Internal server error'

  if (error.name === 'ValidationError') {
    message = Object.values(error.errors).map((item) => item.message).join(', ')
  } else if (error.name === 'MulterError') {
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Document must be 5 MB or smaller' : error.message
  } else if (error.code === 11000) {
    message = 'A record with that value already exists'
  } else if (statusCode < 500) {
    message = error.message || 'Request failed'
  }

  res.status(statusCode).json({ success: false, message, path: req.originalUrl })
}
