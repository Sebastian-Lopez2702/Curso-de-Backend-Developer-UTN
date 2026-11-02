import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authorizeRoles, verifyToken } from '../middleware/verifyToken';
import { UserRole } from '../models/user';
import { CategoryRepository } from '../repositories/categoryRepository';
import { ProductRepository } from '../repositories/productRepository';
import { ProductService } from '../services/productService';

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const productService = new ProductService(productRepository, categoryRepository);
const productController = new ProductController(productService);

const router = Router();

router.get('/', productController.getAll);
router.get('/mine', verifyToken, authorizeRoles(UserRole.SELLER), productController.getMine);
router.get('/:id', productController.getById);
router.post('/', verifyToken, authorizeRoles(UserRole.SELLER), productController.create);
router.put('/:id', verifyToken, authorizeRoles(UserRole.SELLER), productController.update);
router.delete('/:id', verifyToken, authorizeRoles(UserRole.SELLER), productController.delete);

export { router as productRouter };
