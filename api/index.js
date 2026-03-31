import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    const url = req.url.split('?')[0]

    // =========================
    // HEALTH
    // =========================
    if (url === '/api/health' && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' })
    }

    // =========================
    // REGISTER
    // =========================
    if (url === '/api/auth/register' && req.method === 'POST') {
      const { email, username, password, fullName } = req.body

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      })

      if (existing) {
        return res.status(400).json({ error: 'Usuário já existe' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName
        }
      })

      return res.status(201).json(user)
    }

    // =========================
    // LOGIN
    // =========================
    if (url === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return res.status(400).json({ error: 'Usuário não encontrado' })
      }

      const valid = await bcrypt.compare(password, user.password)

      if (!valid) {
        return res.status(400).json({ error: 'Senha inválida' })
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return res.status(200).json({ token, user })
    }

    // =========================
    // GET USERS
    // =========================
    if (url === '/api/users' && req.method === 'GET') {
      const users = await prisma.user.findMany()
      return res.status(200).json(users)
    }

    // =========================
    // GET USER BY ID
    // =========================
    if (url.startsWith('/api/users/') && req.method === 'GET') {
      const id = parseInt(url.split('/').pop())

      const user = await prisma.user.findUnique({
        where: { id }
      })

      return res.status(200).json(user)
    }

    // =========================
    // CREATE RESTAURANT
    // =========================
    if (url === '/api/restaurants' && req.method === 'POST') {
      const restaurant = await prisma.restaurant.create({
        data: req.body
      })

      return res.status(201).json(restaurant)
    }

    // =========================
    // GET RESTAURANTS
    // =========================
    if (url === '/api/restaurants' && req.method === 'GET') {
      const restaurants = await prisma.restaurant.findMany()
      return res.status(200).json(restaurants)
    }

    // =========================
    // CREATE REVIEW
    // =========================
    if (url === '/api/reviews' && req.method === 'POST') {
      const review = await prisma.review.create({
        data: req.body
      })

      return res.status(201).json(review)
    }

    // =========================
    // GET REVIEWS
    // =========================
    if (url === '/api/reviews' && req.method === 'GET') {
      const reviews = await prisma.review.findMany({
        include: {
          user: true,
          restaurant: true
        }
      })

      return res.status(200).json(reviews)
    }

    return res.status(404).json({ error: 'Route not found' })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}