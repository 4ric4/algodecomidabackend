import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export class RestaurantController {
  async getAllRestaurants(req: Request, res: Response) {
    try {
      const { skip = 0, take = 20, cuisine } = req.query

      const where: any = {}

      if (cuisine) {
        where.cuisine = {
          has: cuisine as string
        }
      }

      const restaurants = await prisma.restaurant.findMany({
        where,
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { createdAt: 'desc' },
        include: { 
          user: { select: { username: true, avatar: true } },
          reviews: { select: { rating: true } }
        }
      })

      // Enriquecer com dados calculados
      const enrichedRestaurants = restaurants.map(r => {
        const ratings = r.reviews.map(rev => rev.rating)
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0

        return {
          ...r,
          rating: parseFloat(avgRating.toFixed(1)),
          reviewsCount: r.reviews.length,
          reviews: undefined // Remover do retorno para não sobrecarregar
        }
      })

      res.json(enrichedRestaurants)
    } catch (error) {
      console.error('Get all restaurants error:', error)
      res.status(500).json({ error: 'Failed to fetch restaurants' })
    }
  }

  async getRestaurantById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parseInt(id) },
        include: { 
          user: { select: { username: true, avatar: true } },
          reviews: { select: { rating: true } }
        }
      })

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' })
      }

      // Enriquecer com dados calculados
      const ratings = restaurant.reviews.map(rev => rev.rating)
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0

      const enriched = {
        ...restaurant,
        rating: parseFloat(avgRating.toFixed(1)),
        reviewsCount: restaurant.reviews.length,
        reviews: undefined // Remover do retorno
      }

      res.json(enriched)
    } catch (error) {
      console.error('Get restaurant by id error:', error)
      res.status(500).json({ error: 'Failed to fetch restaurant' })
    }
  }

  async createRestaurant(req: Request, res: Response) {
    try {
      const { name, image, description, cuisine, tags, location, priceRange, hours } = req.body
      const userId = req.userId

      // Validar que userId existe
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      // Verificar se � admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || user.admin !== 1) {
        return res.status(403).json({ error: 'Only admins can create restaurants' })
      }

      if (!name || !location) {
        return res.status(400).json({ error: 'Name and location required' })
      }

      // Converter cuisine string para array se necessário
      let cuisineArray = []
      if (cuisine) {
        if (typeof cuisine === 'string') {
          cuisineArray = cuisine.split(',').map(c => c.trim()).filter(c => c)
        } else if (Array.isArray(cuisine)) {
          cuisineArray = cuisine
        }
      }

      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          image,
          description,
          cuisine: cuisineArray,
          tags: tags || [],
          location,
          priceRange,
          hours,
          createdBy: userId
        },
        include: { user: { select: { username: true, avatar: true } } }
      })

      res.status(201).json(restaurant)
    } catch (error) {
      console.error('Create restaurant error:', error)
      res.status(500).json({ error: 'Failed to create restaurant' })
    }
  }

  async updateRestaurant(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId
      let updateData = req.body

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parseInt(id) }
      })

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' })
      }

      if (restaurant.createdBy !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Converter cuisine string para array se necessário
      if (updateData.cuisine && typeof updateData.cuisine === 'string') {
        updateData.cuisine = updateData.cuisine.split(',').map((c: string) => c.trim()).filter((c: string) => c)
      }

      const updated = await prisma.restaurant.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { user: { select: { username: true, avatar: true } } }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update restaurant' })
    }
  }

  async deleteRestaurant(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parseInt(id) }
      })

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' })
      }

      if (restaurant.createdBy !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      await prisma.restaurant.delete({
        where: { id: parseInt(id) }
      })

      res.json({ message: 'Restaurant deleted' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete restaurant' })
    }
  }

  async searchRestaurants(req: Request, res: Response) {
    try {
      const { q } = req.query

      if (!q) {
        return res.status(400).json({ error: 'Search query required' })
      }

      const restaurants = await prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } }
          ]
        },
        include: { user: { select: { username: true, avatar: true } } }
      })

      res.json(restaurants)
    } catch (error) {
      res.status(500).json({ error: 'Search failed' })
    }
  }

  async getTopRestaurants(req: Request, res: Response) {
    try {
      const restaurants = await prisma.restaurant.findMany({
        orderBy: { rating: 'desc' },
        take: 10,
        include: { user: { select: { username: true, avatar: true } } }
      })

      res.json(restaurants)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch top restaurants' })
    }
  }
}
