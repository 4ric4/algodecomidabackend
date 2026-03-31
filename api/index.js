import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 🔥 Evita múltiplas conexões no Vercel
const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default async function handler(req, res) {
  try {
    // =========================
    // 🌐 CORS
    // =========================
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // =========================
    // 🔧 BODY SAFE
    // =========================
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {}

    const url = req.url.split('?')[0]

    // =========================
    // ❤️ HEALTH
    // =========================
    if (url === '/api/health' && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' })
    }

    // =========================
    // 🧑 REGISTER
    // =========================
    if (url === '/api/auth/register' && req.method === 'POST') {
      const { email, username, password, fullName } = body

      if (!email || !username || !password || !fullName) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando' })
      }

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
    // 🔐 LOGIN
    // =========================
    if (url === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha obrigatórios' })
      }

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
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      )

      return res.status(200).json({ token, user })
    }

    // =========================
    // 👤 GET USERS
    // =========================
    if (url === '/api/users' && req.method === 'GET') {
      const users = await prisma.user.findMany()
      return res.status(200).json(users)
    }

    // =========================
    // 👤 GET USER BY ID
    // =========================
    if (url.startsWith('/api/users/') && req.method === 'GET') {
      const id = parseInt(url.split('/').pop())

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' })
      }

      const user = await prisma.user.findUnique({
        where: { id }
      })

      return res.status(200).json(user)
    }

    // =========================
    // 🍽️ CREATE RESTAURANT
    // =========================
    if (url === '/api/restaurants' && req.method === 'POST') {
      const restaurant = await prisma.restaurant.create({
        data: body
      })

      return res.status(201).json(restaurant)
    }

    // =========================
    // 🍽️ GET RESTAURANTS
    // =========================
    if (url === '/api/restaurants' && req.method === 'GET') {
      const restaurants = await prisma.restaurant.findMany()
      return res.status(200).json(restaurants)
    }

    // =========================
    // ⭐ CREATE REVIEW
    // =========================
    if (url === '/api/reviews' && req.method === 'POST') {
      const review = await prisma.review.create({
        data: body
      })

      return res.status(201).json(review)
    }

    // =========================
    // ⭐ GET REVIEWS
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

    // =========================
    // ❌ 404
    // =========================
    return res.status(404).json({ error: 'Route not found' })

  } catch (error) {
    console.error('🔥 ERROR:', error)

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}