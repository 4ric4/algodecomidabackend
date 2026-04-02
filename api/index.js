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
  // 🚨 LOGS DE DEBUG INICIAIS
  console.log('--- NOVA REQUISIÇÃO ---')
  console.log('Método:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
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
        ? (() => { try { return JSON.parse(req.body) } catch (e) { console.error('Erro ao fazer parse do body:', e); return {} } })()
        : req.body || {}

    const url = req.url.split('?')[0]

    // =========================
    // ❤️ HEALTH
    // =========================
    if (url === '/api/health' && req.method === 'GET') {
      return res.status(200).json({ status: 'ok' })
    }

    // =========================
    // 🔐 GET CURRENT USER (ME)
    // =========================
    if (url === '/api/auth/me' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        })
        
        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' })
        }
        
        return res.status(200).json(user)
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' })
      }
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
    // 👤 GET USER BY ID, USERNAME ou PROFILE/USERNAME
    // =========================
    if ((url.startsWith('/api/users/') || url.startsWith('/api/users/profile/')) && req.method === 'GET') {
      console.log('🔍 BUSCANDO USUÁRIO - URL:', url)
      let param = ''
      if (url.startsWith('/api/users/profile/')) {
        param = url.replace('/api/users/profile/', '')
      } else {
        param = url.replace('/api/users/', '')
      }
      console.log('🔍 PARAM EXTRAÍDO:', param)
      let user = null
      if (/^\d+$/.test(param)) {
        console.log('🔍 BUSCANDO POR ID:', param)
        user = await prisma.user.findUnique({ where: { id: parseInt(param) } })
      } else {
        console.log('🔍 BUSCANDO POR USERNAME:', param)
        user = await prisma.user.findUnique({ where: { username: param } })
      }
      console.log('🔍 USUÁRIO ENCONTRADO:', user)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }
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
    // 🚨 LOG COMPLETO DO ERRO
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack,
      raw: error
    })
  }
}