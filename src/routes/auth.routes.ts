import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { AuthController } from '../controllers/auth.controller'

const router = Router()
const authController = new AuthController()

// Register
router.post('/register', authController.register)

// Login
router.post('/login', authController.login)

// Refresh token
router.post('/refresh', authController.refreshToken)

// Logout
router.post('/logout', authenticate, authController.logout)

export default router
