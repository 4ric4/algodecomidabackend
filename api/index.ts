import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes
import authRoutes from '../src/routes/auth.routes'
import restaurantRoutes from '../src/routes/restaurant.routes'
import reviewRoutes from '../src/routes/review.routes'
import userRoutes from '../src/routes/user.routes'

// Load environment variables
dotenv.config()

const app: Express = express()

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/users', userRoutes)

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'Backend is running!' })
})

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' })
})

// Options preflight
app.options('*', cors())

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found', path: req.path })
})

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    status: err.status || 500 
  })
})

export default app
