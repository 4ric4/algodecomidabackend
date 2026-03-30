import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  status?: number
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error)

  const status = error.status || 500
  const message = error.message || 'Internal server error'

  res.status(status).json({
    error: message,
    status
  })
}
