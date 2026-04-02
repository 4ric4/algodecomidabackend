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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
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
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        
        const restaurant = await prisma.restaurant.create({
          data: {
            ...body,
            createdBy: decoded.id
          }
        })

        return res.status(201).json(restaurant)
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        throw error
      }
    }

    // =========================
    // 🍽️ GET RESTAURANTS
    // =========================
    if (url === '/api/restaurants' && req.method === 'GET') {
      const restaurants = await prisma.restaurant.findMany()
      return res.status(200).json(restaurants)
    }

    // =========================
    // 🍽️ GET RESTAURANT BY ID
    // =========================
    if (url.startsWith('/api/restaurants/') && req.method === 'GET' && !url.includes('feed')) {
      const id = parseInt(url.split('/').pop())
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' })
      }
      
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { user: true, reviews: true }
      })
      
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurante não encontrado' })
      }
      
      return res.status(200).json(restaurant)
    }

    // =========================
    // ⭐ CREATE REVIEW
    // =========================
    if (url === '/api/reviews' && req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        
        const review = await prisma.review.create({
          data: {
            ...body,
            userId: decoded.id
          }
        })

        return res.status(201).json(review)
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        throw error
      }
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
    // ⭐ GET REVIEWS BY USER
    // =========================
    if (url.startsWith('/api/reviews/user/') && req.method === 'GET') {
      const userId = parseInt(url.split('/').pop())
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' })
      }
      
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: { user: true, restaurant: true }
      })
      
      return res.status(200).json(reviews)
    }

    // =========================
    // ⭐ GET REVIEWS FEED (FOLLOWING)
    // =========================
    if (url === '/api/reviews/feed/following' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        
        // Pega todos os usuários que o user atual está seguindo
        const following = await prisma.follow.findMany({
          where: { followerId: decoded.id },
          select: { followingId: true }
        })
        
        const followingIds = following.map(f => f.followingId)
        
        // Pega reviews dos usuários que ele segue
        const reviews = await prisma.review.findMany({
          where: {
            userId: { in: followingIds }
          },
          include: { user: true, restaurant: true },
          orderBy: { createdAt: 'desc' }
        })
        
        return res.status(200).json(reviews)
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        throw error
      }
    }

    // =========================
    // 💬 POST COMMENT ON REVIEW
    // =========================
    if (url.startsWith('/api/reviews/') && url.includes('/comments') && req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        const reviewId = parseInt(url.split('/')[3])
        
        if (isNaN(reviewId)) {
          return res.status(400).json({ error: 'ID de review inválido' })
        }
        
        // Tenta atualizar se já existe, senão cria
        let comment = await prisma.comment.findUnique({
          where: {
            userId_reviewId: {
              userId: decoded.id,
              reviewId: reviewId
            }
          }
        })
        
        if (comment) {
          // Atualiza comentário existente
          comment = await prisma.comment.update({
            where: {
              userId_reviewId: {
                userId: decoded.id,
                reviewId: reviewId
              }
            },
            data: {
              text: body.text
            },
            include: { user: true }
          })
        } else {
          // Cria novo comentário
          comment = await prisma.comment.create({
            data: {
              text: body.text,
              userId: decoded.id,
              reviewId: reviewId
            },
            include: { user: true }
          })
        }
        
        return res.status(201).json(comment)
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        throw error
      }
    }

    // =========================
    // ⭐ GET REVIEW BY ID
    // =========================
    if (url.startsWith('/api/reviews/') && req.method === 'GET' && !url.includes('feed') && !url.includes('user') && !url.includes('likes') && !url.includes('comments')) {
      const token = req.headers.authorization?.replace('Bearer ', '')
      const id = parseInt(url.split('/')[3])
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de review inválido' })
      }
      
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          user: true,
          restaurant: true,
          comments: { include: { user: true } },
          likedBy: true
        }
      })
      
      if (!review) {
        return res.status(404).json({ error: 'Review não encontrado' })
      }
      
      // Verificar se o usuário autenticado curtiu
      let userLiked = false
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
          userLiked = review.likedBy.some(like => like.userId === decoded.id)
        } catch (error) {
          // Token inválido, userLiked continua false
        }
      }
      
      return res.status(200).json({
        ...review,
        userLiked
      })
    }

    // =========================
    // 💬 GET COMMENTS OF REVIEW
    // =========================
    if (url.startsWith('/api/reviews/') && url.includes('/comments') && req.method === 'GET') {
      const reviewId = parseInt(url.split('/')[3])
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'ID de review inválido' })
      }
      
      const comments = await prisma.comment.findMany({
        where: { reviewId },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      })
      
      return res.status(200).json(comments)
    }

    // =========================
    // ❤️ GET LIKES OF REVIEW
    // =========================
    if (url.startsWith('/api/reviews/') && url.endsWith('/likes') && req.method === 'GET') {
      const reviewId = parseInt(url.split('/')[3])
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'ID de review inválido' })
      }
      
      const likes = await prisma.reviewLike.findMany({
        where: { reviewId },
        include: { review: true }
      })
      
      return res.status(200).json(likes)
    }

    // =========================
    // ❤️ CHECK IF CURRENT USER LIKED REVIEW
    // =========================
    if (url.startsWith('/api/reviews/') && url.endsWith('/liked') && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(200).json({ liked: false })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        const reviewId = parseInt(url.split('/')[3])
        
        if (isNaN(reviewId)) {
          return res.status(400).json({ error: 'ID de review inválido' })
        }
        
        const like = await prisma.reviewLike.findUnique({
          where: {
            userId_reviewId: {
              userId: decoded.id,
              reviewId: reviewId
            }
          }
        })
        
        return res.status(200).json({ liked: !!like })
      } catch (error) {
        return res.status(200).json({ liked: false })
      }
    }

    // =========================
    // ❤️ LIKE/UNLIKE REVIEW
    // =========================
    if (url.startsWith('/api/reviews/') && url.endsWith('/like') && req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'Não autenticado' })
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
        const reviewId = parseInt(url.split('/')[3])
        
        if (isNaN(reviewId)) {
          return res.status(400).json({ error: 'ID de review inválido' })
        }
        
        // Verifica se já deu like
        const existingLike = await prisma.reviewLike.findUnique({
          where: {
            userId_reviewId: {
              userId: decoded.id,
              reviewId: reviewId
            }
          }
        })
        
        if (existingLike) {
          // Remove like
          await prisma.reviewLike.delete({
            where: {
              userId_reviewId: {
                userId: decoded.id,
                reviewId: reviewId
              }
            }
          })
          
          // Decrementa contador de likes no review
          await prisma.review.update({
            where: { id: reviewId },
            data: { likes: { decrement: 1 } }
          })
          
          return res.status(200).json({ liked: false, message: 'Like removido' })
        } else {
          // Adiciona like
          await prisma.reviewLike.create({
            data: {
              userId: decoded.id,
              reviewId: reviewId
            }
          })
          
          // Incrementa contador de likes no review
          await prisma.review.update({
            where: { id: reviewId },
            data: { likes: { increment: 1 } }
          })
          
          return res.status(201).json({ liked: true, message: 'Like adicionado' })
        }
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        throw error
      }
    }

    // =========================
    // 👤 GET USER FOLLOWING LIST
    // =========================
    if (url.startsWith('/api/users/') && url.includes('/following-list') && req.method === 'GET') {
      const userId = parseInt(url.split('/')[3])
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' })
      }
      
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true }
      })
      
      return res.status(200).json(following.map(f => f.following))
    }

    // =========================
    // 👤 GET USER FOLLOWERS
    // =========================
    if (url.startsWith('/api/users/') && url.endsWith('/followers') && req.method === 'GET') {
      const userId = parseInt(url.split('/')[3])
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' })
      }
      
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true }
      })
      
      return res.status(200).json(followers.map(f => f.follower))
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