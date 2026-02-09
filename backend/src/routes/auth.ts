import { Router } from "express";
import { register, login, getCurrentUser } from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 * Body: { nombre, email, password }
 * Response: { token, user: { id, nombre, email, rol } }
 */
router.post("/register", register);

/**
 * POST /api/auth/login
 * Iniciar sesión con credenciales
 * Body: { email, password }
 * Response: { token, user: { id, nombre, email, rol } }
 */
router.post("/login", login);

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 * Requiere: Token JWT válido en header Authorization
 * Response: { user: { id, nombre, email, rol } }
 */
router.get("/me", verifyToken, getCurrentUser);

export default router;
