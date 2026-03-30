import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export class FollowController {
  // Seguir um usuário
  async followUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const currentUserId = req.userId

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (parseInt(userId) === currentUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' })
      }

      // Validar que usuário existe
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      })

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Criar follow
      const follow = await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: parseInt(userId)
        }
      })

      // Atualizar contadores
      await prisma.user.update({
        where: { id: currentUserId },
        data: { following: { increment: 1 } }
      })

      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { followers: { increment: 1 } }
      })

      res.json({ message: 'User followed successfully' })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Already following this user' })
      }
      console.error('Follow error:', error)
      res.status(500).json({ error: 'Failed to follow user' })
    }
  }

  // Deixar de seguir um usuário
  async unfollowUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const currentUserId = req.userId

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      if (parseInt(userId) === currentUserId) {
        return res.status(400).json({ error: 'Cannot unfollow yourself' })
      }

      // Validar que usuário existe
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      })

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Deletar follow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: parseInt(userId)
          }
        }
      })

      // Atualizar contadores
      await prisma.user.update({
        where: { id: currentUserId },
        data: { following: { decrement: 1 } }
      })

      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { followers: { decrement: 1 } }
      })

      res.json({ message: 'User unfollowed successfully' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(400).json({ error: 'Not following this user' })
      }
      console.error('Unfollow error:', error)
      res.status(500).json({ error: 'Failed to unfollow user' })
    }
  }

  // Verificar se está seguindo um usuário
  async isFollowing(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const currentUserId = req.userId

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: parseInt(userId)
          }
        }
      })

      res.json({ isFollowing: !!follow })
    } catch (error) {
      res.status(500).json({ error: 'Failed to check follow status' })
    }
  }

  // Obter seguidores
  async getFollowers(req: Request, res: Response) {
    try {
      const { userId } = req.params

      const followers = await prisma.follow.findMany({
        where: { followingId: parseInt(userId) },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              level: true
            }
          }
        }
      })

      res.json(followers.map(f => f.follower))
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch followers' })
    }
  }

  // Obter quem está seguindo
  async getFollowing(req: Request, res: Response) {
    try {
      const { userId } = req.params

      const following = await prisma.follow.findMany({
        where: { followerId: parseInt(userId) },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              level: true
            }
          }
        }
      })

      res.json(following.map(f => f.following))
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch following' })
    }
  }
}
