import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authorizeRoles, verifyToken } from "../middleware/verifyToken";
import { UserRepository } from "../repositories/userRepository";
import { UserService } from "../services/userService";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", verifyToken, userController.me);
router.get("/", verifyToken, authorizeRoles("ADMIN"), userController.getAll);

export { router as userRouter };
