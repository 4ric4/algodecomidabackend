import { Request, Response, NextFunction } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId?: number
      user?: any
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.userId = (decoded as any).userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Autenticação OPCIONAL - se houver token, extrai o userId, senão continua sem erro
export const authenticateOptional = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
      req.userId = (decoded as any).userId
    }
    // Sempre continua, com ou sem token
    next()
  } catch (error) {
    // Se houver erro no token, ignora e continua sem autenticação
    next()
  }
}

export const generateToken = (userId: number): string => {
  const secret = (process.env.JWT_SECRET as string) || 'secret'
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d' }
  return jwt.sign({ userId }, secret, options)
}
