import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// Helper para enriquecer review com informações adicionais
async function enrichReview(review: any, userId?: number) {
  // Buscar se o usuário curtiu
  const likes_by_user = userId ? !!(await prisma.reviewLike.findUnique({
    where: {
      userId_reviewId: {
        userId: userId,
        reviewId: review.id
      }
    }
  })) : false

  // Buscar comentários com informações do usuário
  const comments = await prisma.comment.findMany({
    where: { reviewId: review.id },
    include: {
      user: { select: { id: true, username: true, avatar: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  return {
    ...review,
    likes_by_user,
    comments,
    commentCount: comments.length
  }
}

// Helper para enriquecer múltiplos reviews
async function enrichReviews(reviews: any[], userId?: number) {
  return Promise.all(reviews.map(r => enrichReview(r, userId)))
}

export class ReviewController {
  async getAllReviews(req: Request, res: Response) {
    try {
      const { skip = 0, take = 20 } = req.query

      const reviews = await prisma.review.findMany({
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          restaurantId: true,
          userId: true,
          rating: true,
          title: true,
          text: true,
          images: true,
          dishes: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      console.log('📊 getAllReviews - Reviews encontradas:', reviews.length, { firstId: reviews[0]?.id })

      const enrichedReviews = await enrichReviews(reviews, req.userId)

      res.json(enrichedReviews)
    } catch (error) {
      console.error('❌ getAllReviews error:', error)
      res.status(500).json({ error: 'Failed to fetch reviews' })
    }
  }

  async getReviewById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          restaurantId: true,
          userId: true,
          rating: true,
          title: true,
          text: true,
          images: true,
          dishes: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      console.log('🔍 getReviewById - Review encontrada:', { id: review.id })

      const enrichedReview = await enrichReview(review, req.userId)

      res.json(enrichedReview)
    } catch (error) {
      console.error('❌ getReviewById error:', error)
      res.status(500).json({ error: 'Failed to fetch review' })
    }
  }

  async getReviewsByRestaurant(req: Request, res: Response) {
    try {
      const { restaurantId } = req.params
      const { skip = 0, take = 20 } = req.query

      const reviews = await prisma.review.findMany({
        where: { restaurantId: parseInt(restaurantId) },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          restaurantId: true,
          userId: true,
          rating: true,
          title: true,
          text: true,
          images: true,
          dishes: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReviews = await enrichReviews(reviews, req.userId)

      res.json(enrichedReviews)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' })
    }
  }

  async getReviewsByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const { skip = 0, take = 20 } = req.query

      const reviews = await prisma.review.findMany({
        where: { userId: parseInt(userId) },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          restaurantId: true,
          userId: true,
          rating: true,
          title: true,
          text: true,
          images: true,
          dishes: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReviews = await enrichReviews(reviews, req.userId)

      res.json(enrichedReviews)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' })
    }
  }

  async createReview(req: Request, res: Response) {
    try {
      const { title, text, rating, restaurantId, dishes, images } = req.body
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (!title || !text || !rating || !restaurantId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' })
      }

      if (title.length < 3 || title.length > 100) {
        return res.status(400).json({ error: 'Title must be between 3 and 100 characters' })
      }

      if (text.length < 10 || text.length > 5000) {
        return res.status(400).json({ error: 'Text must be between 10 and 5000 characters' })
      }

      // Validar restaurant existe
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parseInt(restaurantId) }
      })

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' })
      }

      // Validar imagens (max 5MB cada, max 5 imagens)
      const validatedImages = []
      if (images && Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === 'string' && img.startsWith('data:image')) {
            // Estimar tamanho do base64: tamanho string / 4 * 3 bytes (aproximado)
            const sizeInBytes = (img.length * 3) / 4
            const sizeInMB = sizeInBytes / (1024 * 1024)
            
            if (sizeInMB > 5) {
              return res.status(400).json({ error: 'Image too large (max 5MB per image)' })
            }
            validatedImages.push(img)
          }
        }
        
        if (validatedImages.length > 5) {
          return res.status(400).json({ error: 'Maximum 5 images allowed' })
        }
      }

      const review = await prisma.review.create({
        data: {
          title,
          text,
          rating,
          restaurantId: parseInt(restaurantId),
          userId: userId,
          dishes: dishes && Array.isArray(dishes) ? dishes.filter((d: string) => d && d.trim()) : [],
          images: validatedImages
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReview = await enrichReview(review, userId)
      res.status(201).json(enrichedReview)
    } catch (error) {
      console.error('Create review error:', error)
      res.status(500).json({ error: 'Failed to create review' })
    }
  }

  async updateReview(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId
      const updateData = req.body

      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      if (review.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const updated = await prisma.review.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReview = await enrichReview(updated, userId)
      res.json(enrichedReview)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update review' })
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId

      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      if (review.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      await prisma.review.delete({
        where: { id: parseInt(id) }
      })

      res.json({ message: 'Review deleted' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete review' })
    }
  }

  async likeReview(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId

      console.log('📍 likeReview called:', { id, userId, params: req.params })

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Review ID is required' })
      }

      const reviewId = parseInt(id)
      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' })
      }

      // Verificar se review existe
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      // Verificar se já curtiu
      const existingLike = await prisma.reviewLike.findUnique({
        where: {
          userId_reviewId: {
            userId: userId,
            reviewId: reviewId
          }
        }
      })

      if (existingLike) {
        // Se já curtiu, remover o like (toggle)
        await prisma.reviewLike.delete({
          where: {
            userId_reviewId: {
              userId: userId,
              reviewId: reviewId
            }
          }
        })

        // Decrementar contador
        const updated = await prisma.review.update({
          where: { id: reviewId },
          data: { likes: { decrement: 1 } },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            restaurant: { select: { id: true, name: true } }
          }
        })

        const enrichedReview = await enrichReview(updated, userId)
        return res.json(enrichedReview)
      }

      // Criar like
      await prisma.reviewLike.create({
        data: {
          userId: userId,
          reviewId: reviewId
        }
      })

      // Incrementar contador
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { likes: { increment: 1 } },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReview = await enrichReview(updated, userId)
      res.json(enrichedReview)
    } catch (error) {
      console.error('Like error:', error)
      res.status(500).json({ error: 'Failed to like review' })
    }
  }

  async unlikeReview(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId

      console.log('📍 unlikeReview called:', { id, userId, params: req.params })

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Review ID is required' })
      }

      const reviewId = parseInt(id)
      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' })
      }

      // Verificar se review existe
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      // Verificar se curtiu
      const existingLike = await prisma.reviewLike.findUnique({
        where: {
          userId_reviewId: {
            userId: userId,
            reviewId: reviewId
          }
        }
      })

      if (!existingLike) {
        // Se não curtiu, retornar o estado atual (sem erro)
        const currentReview = await prisma.review.findUnique({
          where: { id: reviewId },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            restaurant: { select: { id: true, name: true } }
          }
        })
        const enrichedReview = await enrichReview(currentReview, userId)
        return res.json(enrichedReview)
      }

      // Deletar like
      await prisma.reviewLike.delete({
        where: {
          userId_reviewId: {
            userId: userId,
            reviewId: reviewId
          }
        }
      })

      // Decrementar contador
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { likes: { decrement: 1 } },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          restaurant: { select: { id: true, name: true } }
        }
      })

      const enrichedReview = await enrichReview(updated, userId)
      res.json(enrichedReview)
    } catch (error) {
      console.error('Unlike error:', error)
      res.status(500).json({ error: 'Failed to unlike review' })
    }
  }

  async getFollowingReviews(req: Request, res: Response) {
    try {
      const userId = req.userId
      const { skip = 0, take = 20 } = req.query

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      // Buscar IDs dos usuarios que este usuario segue
      const followedUsers = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      })

      const followedUserIds = followedUsers.map(f => f.followingId)

      // Se nao segue ninguem, retornar array vazio
      if (followedUserIds.length === 0) {
        return res.json([])
      }

      // Buscar reviews apenas dos usuarios que segue
      const reviews = await prisma.review.findMany({
        where: {
          userId: {
            in: followedUserIds
          }
        },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          restaurantId: true,
          userId: true,
          rating: true,
          title: true,
          text: true,
          images: true,
          dishes: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          user: { 
            select: { 
              id: true, 
              username: true, 
              fullName: true,
              avatar: true,
              level: true
            } 
          },
          restaurant: { 
            select: { 
              id: true, 
              name: true,
              image: true
            } 
          }
        }
      })

      const enrichedReviews = await enrichReviews(reviews, req.userId)

      res.json(enrichedReviews)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch following reviews' })
    }
  }
}
