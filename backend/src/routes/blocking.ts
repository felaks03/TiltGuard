import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getBlockingStatus,
  activateBlocking,
} from "../controllers/blockingController";

const router = Router();

// GET /api/blocking/status - Obtener estado de bloqueo
router.get("/status", verifyToken, getBlockingStatus);

// POST /api/blocking/activate - Activar bloqueo
router.post("/activate", verifyToken, activateBlocking);

export default router;
