import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authorizeRoles, verifyToken } from '../middleware/verifyToken';
import { UserRole } from '../models/user';
import { OrderRepository } from '../repositories/orderRepository';
import { ProductRepository } from '../repositories/productRepository';
import { OrderService } from '../services/orderService';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const orderService = new OrderService(orderRepository, productRepository);
const orderController = new OrderController(orderService);

const router = Router();

router.get('/cart', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.getCart);
router.post('/cart', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.addToCart);

export { router as orderRouter };
