import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { UserController } from '../controllers/user.controller'

const router = Router()
const userController = new UserController()

// Get user profile
router.get('/profile/:username', userController.getProfile)

// Get current user (requires auth)
router.get('/me', authenticate, userController.getCurrentUser)

// Update profile
router.put('/:id', authenticate, userController.updateProfile)

// Get user statistics
router.get('/:id/stats', userController.getUserStats)

// Follow user
router.post('/:id/follow', authenticate, userController.followUser)

// Unfollow user
router.delete('/:id/follow', authenticate, userController.unfollowUser)

// Check if following user
router.get('/:id/following', authenticate, userController.checkFollowing)

// Get followers list
router.get('/:id/followers', authenticate, userController.getFollowers)

// Get following list
router.get('/:id/following-list', authenticate, userController.getFollowing)

// Remove follower
router.delete('/:id/followers/:followerId', authenticate, userController.removeFollower)

export default router
