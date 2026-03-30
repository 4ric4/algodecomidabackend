import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const { username } = req.params

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          level: true,
          followers: true,
          following: true,
          reviewsCount: true,
          createdAt: true,
          admin: true
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' })
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.userId

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          level: true,
          xp: true,
          followers: true,
          following: true,
          reviewsCount: true,
          createdAt: true,
          admin: true
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(user)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current user' })
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId
      const { username, bio, avatar } = req.body

      if (parseInt(id) !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Validar dados
      const updateData: any = {}
      
      if (username !== undefined) {
        updateData.username = username.trim()
      }
      
      if (bio !== undefined) {
        updateData.bio = bio.trim()
      }
      
      if (avatar !== undefined && avatar !== null) {
        // Avatar pode ser base64 string
        if (avatar.startsWith('data:image')) {
          updateData.avatar = avatar
        } else {
          updateData.avatar = avatar
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          email: true,
          level: true,
          xp: true,
          followers: true,
          following: true,
          reviewsCount: true,
          admin: true
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const stats = {
        totalReviews: user.reviewsCount,
        level: user.level,
        xp: user.xp,
        followers: user.followers,
        following: user.following
      }

      res.json(stats)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  }

  async followUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId as number

      if (parseInt(id) === userId) {
        return res.status(400).json({ error: 'Cannot follow yourself' })
      }

      // Validar que usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      })

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Criar follow
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: parseInt(id)
        }
      })

      // Atualizar contadores
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { followers: { increment: 1 } }
      })

      await prisma.user.update({
        where: { id: userId },
        data: { following: { increment: 1 } }
      })

      res.json({ message: 'User followed' })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Already following this user' })
      }
      res.status(500).json({ error: 'Failed to follow user' })
    }
  }

  async unfollowUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId as number

      if (parseInt(id) === userId) {
        return res.status(400).json({ error: 'Cannot unfollow yourself' })
      }

      // Validar que usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      })

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Deletar follow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: parseInt(id)
          }
        }
      })

      // Atualizar contadores
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { followers: { decrement: 1 } }
      })

      await prisma.user.update({
        where: { id: userId },
        data: { following: { decrement: 1 } }
      })

      res.json({ message: 'User unfollowed' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(400).json({ error: 'Not following this user' })
      }
      res.status(500).json({ error: 'Failed to unfollow user' })
    }
  }

  async checkFollowing(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId as number

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: parseInt(id)
          }
        }
      })

      res.json({ following: !!follow })
    } catch (error) {
      res.status(500).json({ error: 'Failed to check follow status' })
    }
  }

  async getFollowers(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId as number

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Buscar seguidores deste usuário
      const followers = await prisma.follow.findMany({
        where: { followingId: parseInt(id) },
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true
            }
          }
        }
      })

      // Enriquecer dados com informação se o usuário atual segue cada um
      const enrichedFollowers = await Promise.all(
        followers.map(async (f) => {
          let isFollowing = false
          if (userId) {
            const follow = await prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: userId,
                  followingId: f.follower.id
                }
              }
            })
            isFollowing = !!follow
          }
          return {
            ...f.follower,
            isFollowing
          }
        })
      )

      res.json(enrichedFollowers)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch followers' })
    }
  }

  async getFollowing(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId as number

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Buscar usuários que este usuário está seguindo
      const following = await prisma.follow.findMany({
        where: { followerId: parseInt(id) },
        select: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true
            }
          }
        }
      })

      // Enriquecer dados com informação se o usuário atual segue cada um
      const enrichedFollowing = await Promise.all(
        following.map(async (f) => {
          let isFollowing = false
          if (userId) {
            const follow = await prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: userId,
                  followingId: f.following.id
                }
              }
            })
            isFollowing = !!follow
          }
          return {
            ...f.following,
            isFollowing
          }
        })
      )

      res.json(enrichedFollowing)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch following' })
    }
  }

  async removeFollower(req: Request, res: Response) {
    try {
      const { id, followerId } = req.params
      const userId = req.userId as number

      if (parseInt(id) !== userId) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Validar que usuario existe
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(followerId) }
      })

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Deletar follow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: parseInt(followerId),
            followingId: parseInt(id)
          }
        }
      })

      // Atualizar contadores
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { followers: { decrement: 1 } }
      })

      await prisma.user.update({
        where: { id: parseInt(followerId) },
        data: { following: { decrement: 1 } }
      })

      res.json({ message: 'Follower removed' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(400).json({ error: 'Not a follower' })
      }
      res.status(500).json({ error: 'Failed to remove follower' })
    }
  }
}
