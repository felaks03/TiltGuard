import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware para verificar el token JWT
 * Extrae el token del header Authorization: Bearer <token>
 * Verifica la validez del token
 * Añade el userId al objeto request para usar en controladores
 */
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Token no proporcionado",
      });
      return;
    }

    // Extraer el token (sin "Bearer ")
    const token = authHeader.slice(7);

    // Verificar el token
    const secret = process.env.JWT_SECRET || "tu_super_secreto_seguro";
    const decoded = jwt.verify(token, secret) as { id: string };

    // Añadir el userId al objeto request para usarlo en controladores
    (req as any).userId = decoded.id;

    next();
  } catch (error) {
    const err = error as any;

    // Distinguir entre diferentes tipos de errores
    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Token expirado",
      });
      return;
    }

    if (err.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: "Token inválido",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "No autorizado",
    });
  }
};

/**
 * Middleware para verificar que el usuario sea admin
 * Debe usarse DESPUÉS de verifyToken
 * Requiere que el usuario tenga rol "admin"
 */
export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "No autorizado",
      });
      return;
    }

    // Importar aquí para evitar problemas de circular dependency
    const User = require("../models/User").default;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }

    if (user.rol !== "admin") {
      res.status(403).json({
        success: false,
        error: "No tienes permisos de administrador",
      });
      return;
    }

    next();
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error en verificación de permisos",
    });
  }
};
