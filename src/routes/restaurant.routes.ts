import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { RestaurantController } from '../controllers/restaurant.controller'

const router = Router()
const restaurantController = new RestaurantController()

// Get all restaurants
router.get('/', restaurantController.getAllRestaurants)

// Get restaurant by ID
router.get('/:id', restaurantController.getRestaurantById)

// Create restaurant (requires auth)
router.post('/', authenticate, restaurantController.createRestaurant)

// Update restaurant
router.put('/:id', authenticate, restaurantController.updateRestaurant)

// Delete restaurant
router.delete('/:id', authenticate, restaurantController.deleteRestaurant)

// Search restaurants
router.get('/search/q', restaurantController.searchRestaurants)

// Get top restaurants
router.get('/top', restaurantController.getTopRestaurants)

export default router
