import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authorizeRoles, verifyToken } from '../middleware/verifyToken';
import { UserRole } from '../models/user';
import { CategoryRepository } from '../repositories/categoryRepository';
import { ProductRepository } from '../repositories/productRepository';
import { CategoryService } from '../services/categoryService';

const categoryRepository = new CategoryRepository();
const productRepository = new ProductRepository();
const categoryService = new CategoryService(categoryRepository, productRepository);
const categoryController = new CategoryController(categoryService);

const router = Router();

router.get('/', categoryController.getAll);
router.post('/', verifyToken, authorizeRoles(UserRole.ADMIN), categoryController.create);
router.delete('/:id', verifyToken, authorizeRoles(UserRole.ADMIN), categoryController.delete);

export { router as categoryRouter };
