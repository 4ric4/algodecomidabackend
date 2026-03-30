import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes from compiled dist
import authRoutes from '../dist/routes/auth.routes.js'
import restaurantRoutes from '../dist/routes/restaurant.routes.js'
import reviewRoutes from '../dist/routes/review.routes.js'
import userRoutes from '../dist/routes/user.routes.js'

// Load environment variables
dotenv.config()

const app: Express = express()

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'Backend is running!' })
})

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' })
})

// API Routes
try {
  app.use('/api/auth', authRoutes)
  app.use('/api/restaurants', restaurantRoutes)
  app.use('/api/reviews', reviewRoutes)
  app.use('/api/users', userRoutes)
} catch (error) {
  console.error('Error loading routes:', error)
}

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
    status: err.status || 500,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

export default app
