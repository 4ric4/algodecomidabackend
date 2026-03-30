import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'

// Import routes
import authRoutes from '../src/routes/auth.routes'
import restaurantRoutes from '../src/routes/restaurant.routes'
import reviewRoutes from '../src/routes/review.routes'
import userRoutes from '../src/routes/user.routes'

// Import middleware
import { authenticate } from '../src/middleware/auth.middleware'
import { errorHandler } from '../src/middleware/error.middleware'

// Load environment variables
dotenv.config()

const app: Express = express()

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/users', userRoutes)

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(errorHandler)

export default app
