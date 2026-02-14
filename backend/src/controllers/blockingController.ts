import { Request, Response } from "express";
import BlockSettings from "../models/BlockSettings";

/**
 * Obtener estado de bloqueo del usuario autenticado
 * GET /api/blocking/status
 */
export const getBlockingStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    let settings = await BlockSettings.findOne({ userId });

    if (!settings) {
      res.json({
        success: true,
        data: {
          blockRiskSettings: false,
          blockUntil: null,
        },
      });
      return;
    }

    // Auto-desactivar si el bloqueo ha expirado
    if (
      settings.blockRiskSettings &&
      settings.blockUntil &&
      new Date() >= settings.blockUntil
    ) {
      settings.blockRiskSettings = false;
      settings.blockUntil = null;
      await settings.save();
    }

    res.json({
      success: true,
      data: {
        blockRiskSettings: settings.blockRiskSettings,
        blockUntil: settings.blockUntil
          ? settings.blockUntil.toISOString()
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener el estado de bloqueo",
    });
  }
};

/**
 * Activar bloqueo de Risk Settings
 * POST /api/blocking/activate
 * Body: { duration: "day" | "week" | "month" }
 */
export const activateBlocking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { duration } = req.body;

    if (!duration || !["day", "week", "month"].includes(duration)) {
      res.status(400).json({
        success: false,
        error: "Duración inválida. Debe ser 'day', 'week' o 'month'",
      });
      return;
    }

    // Verificar si ya hay un bloqueo activo
    const existing = await BlockSettings.findOne({ userId });
    if (
      existing &&
      existing.blockRiskSettings &&
      existing.blockUntil &&
      new Date() < existing.blockUntil
    ) {
      res.status(400).json({
        success: false,
        error: "Ya existe un bloqueo activo. Debes esperar a que expire.",
      });
      return;
    }

    // Calcular blockUntil en UTC
    const now = new Date();
    let blockUntil: Date;

    if (duration === "day") {
      // Medianoche del mismo día UTC
      blockUntil = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    } else if (duration === "week") {
      // Domingo a medianoche UTC
      const dayOfWeek = now.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      blockUntil = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysUntilSunday,
          23,
          59,
          59,
          999,
        ),
      );
    } else {
      // Último día del mes a medianoche UTC
      blockUntil = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      );
    }

    // Upsert: crear o actualizar
    const settings = await BlockSettings.findOneAndUpdate(
      { userId },
      {
        blockRiskSettings: true,
        blockUntil,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({
      success: true,
      data: {
        blockRiskSettings: settings.blockRiskSettings,
        blockUntil: settings.blockUntil
          ? settings.blockUntil.toISOString()
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al activar el bloqueo",
    });
  }
};
