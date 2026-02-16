import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getGuideAccessStatus,
  completeSetup,
  requestAccess,
  undoSetup,
  registerExtension,
} from "../controllers/guideAccessController";

const router = Router();

// GET /api/guide-access/status - Obtener estado de acceso a guías
router.get("/status", verifyToken, getGuideAccessStatus);

// POST /api/guide-access/complete-setup - Marcar setup como completado
router.post("/complete-setup", verifyToken, completeSetup);

// POST /api/guide-access/request-access - Solicitar acceso (inicia cooldown 2h)
router.post("/request-access", verifyToken, requestAccess);

// POST /api/guide-access/register-extension - Registrar ID de extensión Chrome
router.post("/register-extension", verifyToken, registerExtension);

// POST /api/guide-access/undo-setup - Deshacer setup (desinstalación)
router.post("/undo-setup", verifyToken, undoSetup);

export default router;
