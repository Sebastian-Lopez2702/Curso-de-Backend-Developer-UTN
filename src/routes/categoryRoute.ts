import { Router } from "express";
import { CategoryController } from "../controllers/categoryController";
import { authorizeRoles, verifyToken } from "../middleware/verifyToken";
import { CategoryRepository } from "../repositories/categoryRepository";
import { CategoryService } from "../services/categoryService";

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

const router = Router();

router.get("/", categoryController.getAll);
router.post("/", verifyToken, authorizeRoles("ADMIN"), categoryController.create);
router.delete("/:id", verifyToken, authorizeRoles("ADMIN"), categoryController.delete);

export { router as categoryRouter };
