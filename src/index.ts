import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'

// Import routes
import authRoutes from './routes/auth.routes'
import restaurantRoutes from './routes/restaurant.routes'
import reviewRoutes from './routes/review.routes'
import userRoutes from './routes/user.routes'

// Import middleware
import { authenticate } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error.middleware'

// Load environment variables
dotenv.config()

const app: Express = express()
const httpServer = createServer(app)
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
})

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

// Socket.io events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })

  // Notification events
  socket.on('notification', (data) => {
    io.emit('notification', data)
  })

  // Chat events
  socket.on('message', (data) => {
    io.emit('message', data)
  })
})

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`?? GastroLog Backend running on port ${PORT}`)
  console.log(`?? Environment: ${process.env.NODE_ENV}`)
})

export { io }
