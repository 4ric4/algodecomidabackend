import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export class CommentController {
  // Criar ou atualizar um comentário (1 por usuário por review)
  async createOrUpdateComment(req: Request, res: Response) {
    try {
      const { reviewId } = req.params
      const { text } = req.body
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text cannot be empty' })
      }

      if (text.length > 500) {
        return res.status(400).json({ error: 'Comment must be less than 500 characters' })
      }

      // Validar que review existe
      const review = await prisma.review.findUnique({
        where: { id: parseInt(reviewId) }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      // Criar ou atualizar comentário (upsert)
      const comment = await prisma.comment.upsert({
        where: {
          userId_reviewId: {
            userId: userId,
            reviewId: parseInt(reviewId)
          }
        },
        update: {
          text: text.trim(),
          updatedAt: new Date()
        },
        create: {
          text: text.trim(),
          userId: userId,
          reviewId: parseInt(reviewId)
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      })

      res.json(comment)
    } catch (error) {
      console.error('Create comment error:', error)
      res.status(500).json({ error: 'Failed to create comment' })
    }
  }

  // Obter comentários de um review
  async getCommentsByReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params

      const comments = await prisma.comment.findMany({
        where: { reviewId: parseInt(reviewId) },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      res.json(comments)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' })
    }
  }

  // Deletar comentário
  async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params
      const userId = req.userId

      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(commentId) }
      })

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' })
      }

      if (comment.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' })
      }

      await prisma.comment.delete({
        where: { id: parseInt(commentId) }
      })

      res.json({ message: 'Comment deleted' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' })
    }
  }
}
