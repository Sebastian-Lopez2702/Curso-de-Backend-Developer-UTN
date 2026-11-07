import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authorizeRoles, verifyToken } from '../middleware/verifyToken';
import { UserRole } from '../models/user';
import { OrderRepository } from '../repositories/orderRepository';
import { ProductRepository } from '../repositories/productRepository';
import { ProvinceRepository } from '../repositories/provinceRepository';
import { OrderService } from '../services/orderService';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const provinceRepository = new ProvinceRepository();
const orderService = new OrderService(orderRepository, productRepository, provinceRepository);
const orderController = new OrderController(orderService);

const router = Router();

router.get('/cart', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.getCart);
router.post('/cart', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.addToCart);
router.put('/cart/items/:productId', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.updateCartItem);
router.delete('/cart/items/:productId', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.removeCartItem);
router.post('/:id/checkout', verifyToken, authorizeRoles(UserRole.CLIENT), orderController.checkout);

export { router as orderRouter };
