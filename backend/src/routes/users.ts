import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";

const router = Router();

// Rutas de usuarios - todas requieren autenticación + permisos de admin
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/:id", verifyToken, verifyAdmin, getUserById);
router.post("/", verifyToken, verifyAdmin, createUser);
router.put("/:id", verifyToken, verifyAdmin, updateUser);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

export default router;
