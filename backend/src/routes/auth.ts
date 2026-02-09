import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  impersonate,
  stopImpersonation,
} from "../controllers/authController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";

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

/**
 * POST /api/auth/impersonate/:userId
 * Permite a un admin suplantar a otro usuario
 * Requiere: Token JWT de admin válido en header Authorization
 * Parámetros: userId (ID del usuario a suplantar)
 * Response: { token, user: { id, nombre, email, rol, impersonatedBy } }
 */
router.post("/impersonate/:userId", verifyToken, verifyAdmin, impersonate);

/**
 * POST /api/auth/stop-impersonation
 * Vuelve a la sesión original del admin
 * Requiere: Token JWT de usuario suplantado con impersonatedBy
 * Response: { token, user: { id, nombre, email, rol } }
 */
router.post("/stop-impersonation", verifyToken, stopImpersonation);

export default router;
