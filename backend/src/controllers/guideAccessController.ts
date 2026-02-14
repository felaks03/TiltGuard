import { Request, Response } from "express";
import GuideAccess from "../models/GuideAccess";

/**
 * Obtener estado de acceso a guías del usuario autenticado
 * GET /api/guide-access/status
 */
export const getGuideAccessStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    let access = await GuideAccess.findOne({ userId });

    if (!access) {
      res.json({
        success: true,
        data: {
          setupCompleted: false,
          cooldownUntil: null,
          accessUntil: null,
          extensionId: null,
        },
      });
      return;
    }

    const now = new Date();

    // Auto-limpiar cooldown expirado
    if (access.cooldownUntil && now >= access.cooldownUntil) {
      // Cooldown terminado: otorgar 24h de acceso
      if (!access.accessUntil || now >= access.accessUntil) {
        access.accessUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        access.cooldownUntil = null;
        await access.save();
      }
    }

    // Auto-limpiar acceso expirado
    if (access.accessUntil && now >= access.accessUntil) {
      access.accessUntil = null;
      await access.save();
    }

    res.json({
      success: true,
      data: {
        setupCompleted: access.setupCompleted,
        cooldownUntil: access.cooldownUntil
          ? access.cooldownUntil.toISOString()
          : null,
        accessUntil: access.accessUntil
          ? access.accessUntil.toISOString()
          : null,
        extensionId: access.extensionId || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener el estado de acceso a guías",
    });
  }
};

/**
 * Marcar setup como completado
 * POST /api/guide-access/complete-setup
 */
export const completeSetup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const access = await GuideAccess.findOneAndUpdate(
      { userId },
      { setupCompleted: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({
      success: true,
      data: {
        setupCompleted: access.setupCompleted,
        cooldownUntil: access.cooldownUntil
          ? access.cooldownUntil.toISOString()
          : null,
        accessUntil: access.accessUntil
          ? access.accessUntil.toISOString()
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al completar el setup",
    });
  }
};

/**
 * Solicitar acceso (inicia cooldown de 2 horas)
 * POST /api/guide-access/request-access
 */
export const requestAccess = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    let access = await GuideAccess.findOne({ userId });

    if (!access) {
      access = await GuideAccess.create({ userId, setupCompleted: true });
    }

    const now = new Date();

    // Si ya hay acceso activo, no iniciar otro cooldown
    if (access.accessUntil && now < access.accessUntil) {
      res.json({
        success: true,
        data: {
          setupCompleted: access.setupCompleted,
          cooldownUntil: null,
          accessUntil: access.accessUntil.toISOString(),
        },
      });
      return;
    }

    // Si ya hay cooldown activo, devolver el existente
    if (access.cooldownUntil && now < access.cooldownUntil) {
      res.json({
        success: true,
        data: {
          setupCompleted: access.setupCompleted,
          cooldownUntil: access.cooldownUntil.toISOString(),
          accessUntil: null,
        },
      });
      return;
    }

    // Iniciar cooldown de 10 segundos (testing) - cambiar a 2 * 60 * 60 * 1000 para producción
    const cooldownUntil = new Date(now.getTime() + 10 * 1000);

    access.cooldownUntil = cooldownUntil;
    access.accessUntil = null;
    await access.save();

    res.json({
      success: true,
      data: {
        setupCompleted: access.setupCompleted,
        cooldownUntil: cooldownUntil.toISOString(),
        accessUntil: null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al solicitar acceso",
    });
  }
};

/**
 * Registrar ID de la extensión de Chrome
 * POST /api/guide-access/register-extension
 */
export const registerExtension = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { extensionId } = req.body;

    if (!extensionId || typeof extensionId !== "string") {
      res.status(400).json({
        success: false,
        error: "extensionId es requerido",
      });
      return;
    }

    await GuideAccess.findOneAndUpdate(
      { userId },
      { extensionId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al registrar la extensión",
    });
  }
};

/**
 * Deshacer setup (para desinstalación)
 * POST /api/guide-access/undo-setup
 */
export const undoSetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    await GuideAccess.findOneAndUpdate(
      { userId },
      {
        setupCompleted: false,
        cooldownUntil: null,
        accessUntil: null,
      },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      data: {
        setupCompleted: false,
        cooldownUntil: null,
        accessUntil: null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al deshacer el setup",
    });
  }
};
