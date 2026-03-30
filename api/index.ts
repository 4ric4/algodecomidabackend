import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' })
})

// Auth stub endpoints
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ message: 'Register endpoint', stub: true })
})

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint', stub: true })
})

app.post('/api/auth/refresh', (req, res) => {
  res.json({ message: 'Refresh endpoint', stub: true })
})

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout endpoint', stub: true })
})

// Restaurant endpoints
app.get('/api/restaurants', (req, res) => {
  res.json({ message: 'Get restaurants', stub: true })
})

app.post('/api/restaurants', (req, res) => {
  res.json({ message: 'Create restaurant', stub: true })
})

// Review endpoints
app.get('/api/reviews', (req, res) => {
  res.json({ message: 'Get reviews', stub: true })
})

app.post('/api/reviews', (req, res) => {
  res.json({ message: 'Create review', stub: true })
})

// User endpoints
app.get('/api/users/:id', (req, res) => {
  res.json({ message: 'Get user', stub: true })
})

app.put('/api/users/:id', (req, res) => {
  res.json({ message: 'Update user', stub: true })
})

// Options
app.options('*', cors())

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Server error' })
})

export default app
