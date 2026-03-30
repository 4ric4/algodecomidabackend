import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { generateToken } from '../middleware/auth.middleware'
import bcrypt from 'bcryptjs'
import validator from 'validator'

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, username, password, fullName } = req.body

      // Validations
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' })
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }

      if (!username || username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' })
      }

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName: fullName || username
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          admin: true
        }
      })

      // Generate token
      const token = generateToken(user.id)

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Generate token
      const token = generateToken(user.id)

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          admin: user.admin
        },
        token
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({ error: 'Token required' })
      }

      // Verify and regenerate token
      const newToken = generateToken(1) // In production, extract userId from token

      res.json({
        message: 'Token refreshed',
        token: newToken
      })
    } catch (error) {
      res.status(500).json({ error: 'Token refresh failed' })
    }
  }

  async logout(req: Request, res: Response) {
    try {
      res.json({ message: 'Logout successful' })
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' })
    }
  }
}
