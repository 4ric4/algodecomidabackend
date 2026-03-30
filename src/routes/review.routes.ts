import { Router, Request, Response } from 'express'
import { authenticate, authenticateOptional } from '../middleware/auth.middleware'
import { ReviewController } from '../controllers/review.controller'
import { CommentController } from '../controllers/comment.controller'

const router = Router()
const reviewController = new ReviewController()
const commentController = new CommentController()

// Special routes (must be before /:id to avoid conflict)
router.get('/feed/following', authenticate, reviewController.getFollowingReviews)
router.get('/restaurant/:restaurantId', reviewController.getReviewsByRestaurant)
router.get('/user/:userId', reviewController.getReviewsByUser)

// Get all reviews
router.get('/', reviewController.getAllReviews)

// Get review by ID (com autenticação opcional para saber se o usuário curtiu)
router.get('/:id', authenticateOptional, reviewController.getReviewById)

// Review actions
router.post('/', authenticate, reviewController.createReview)
router.put('/:id', authenticate, reviewController.updateReview)
router.delete('/:id', authenticate, reviewController.deleteReview)

// Like/Unlike review
router.post('/:id/like', authenticate, reviewController.likeReview)
router.delete('/:id/like', authenticate, reviewController.unlikeReview)

// Comments endpoints (nested under review ID)
router.get('/:reviewId/comments', commentController.getCommentsByReview)
router.post('/:reviewId/comments', authenticate, commentController.createOrUpdateComment)
router.delete('/:reviewId/comments/:commentId', authenticate, commentController.deleteComment)

// Get review by ID (com autenticação opcional para saber se o usuário curtiu)
router.get('/:id', authenticateOptional, reviewController.getReviewById)

export default router
