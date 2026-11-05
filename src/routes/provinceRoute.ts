import { Router } from 'express';
import { ProvinceController } from '../controllers/provinceController';
import { authorizeRoles, verifyToken } from '../middleware/verifyToken';
import { UserRole } from '../models/user';
import { ProvinceRepository } from '../repositories/provinceRepository';
import { ProvinceService } from '../services/provinceService';

const provinceRepository = new ProvinceRepository();
const provinceService = new ProvinceService(provinceRepository);
const provinceController = new ProvinceController(provinceService);

const router = Router();

router.get('/', provinceController.getAll);
router.put('/:id', verifyToken, authorizeRoles(UserRole.ADMIN), provinceController.update);

export { router as provinceRouter };
