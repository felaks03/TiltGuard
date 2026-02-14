import { Response } from "express";
import { Request } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  impersonatedBy?: string;
}

// Generar JWT Token
const generateToken = (userId: string, impersonatedBy?: string): string => {
  const secret = process.env.JWT_SECRET || "tu_super_secreto_seguro";
  const payload: TokenPayload = { id: userId };

  if (impersonatedBy) {
    payload.impersonatedBy = impersonatedBy;
  }

  // 7 days expiration
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 * Body: { nombre, email, password }
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Por favor proporciona nombre, email y contraseña",
      });
      return;
    }

    // Validar que email sea válido
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: "Por favor proporciona un email válido",
      });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "El email ya está registrado",
      });
      return;
    }

    // Crear nuevo usuario
    const newUser = new User({
      nombre: nombre.trim(),
      email: email.toLowerCase(),
      password,
      rol: "usuario", // Por defecto, nuevo usuario es "usuario"
      activo: true,
    });

    // Guardar usuario (la contraseña se hashea automáticamente en el pre-save hook)
    await newUser.save();

    // Generar token
    const token = generateToken(newUser._id?.toString() || "");

    // Responder con token y datos del usuario
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al registrar usuario",
    });
  }
};

/**
 * POST /api/auth/login
 * Iniciar sesión
 * Body: { email, password }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Por favor proporciona email y contraseña",
      });
      return;
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
      });
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.activo) {
      res.status(401).json({
        success: false,
        error: "Usuario inactivo",
      });
      return;
    }

    // Comparar contraseña
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
      });
      return;
    }

    // Generar token
    const token = generateToken(user._id?.toString() || "");

    // Responder con token y datos del usuario
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al iniciar sesión",
    });
  }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 * Requiere: Token JWT en header Authorization
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // El userId viene del middleware de autenticación
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "No autorizado",
      });
      return;
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al obtener usuario",
    });
  }
};

/**
 * POST /api/auth/impersonate/:userId
 * Permite a un admin suplantar a otro usuario
 * Requiere: Token JWT de admin válido en header Authorization
 * Parámetros: userId (ID del usuario a suplantar)
 * Respuesta: { success: true, token, user: { ... } }
 */
export const impersonate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = (req as any).userId;
    const { userId } = req.params;

    // Validar que se proporcionó userId
    if (!userId) {
      res.status(400).json({
        success: false,
        error: "ID de usuario requerido",
      });
      return;
    }

    // Validar que el admin no intente suplantarse a sí mismo
    if (adminId === userId) {
      res.status(400).json({
        success: false,
        error: "No puedes suplantar tu propia cuenta",
      });
      return;
    }

    // Validar que el usuario a suplantar existe
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }

    // Validar que el usuario a suplantar no sea admin
    if (targetUser.rol === "admin") {
      res.status(403).json({
        success: false,
        error: "No puedes suplantar a otros administradores",
      });
      return;
    }

    // Generar token con el id del usuario suplantado e info del admin
    const token = generateToken(userId, adminId);

    // Responder con token y datos del usuario suplantado
    res.status(200).json({
      success: true,
      token,
      user: {
        id: targetUser._id,
        nombre: targetUser.nombre,
        email: targetUser.email,
        rol: targetUser.rol,
        impersonatedBy: adminId,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al suplantar usuario",
    });
  }
};

/**
 * POST /api/auth/stop-impersonation
 * Vuelve a la sesión original del admin
 * Requiere: Token JWT de usuario suplantado con impersonatedBy
 * Respuesta: { success: true, token, user: { ... } }
 */
export const stopImpersonation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const impersonatedByAdminId = (req as any).impersonatedBy;

    // Validar que el token contiene información de suplantación
    if (!impersonatedByAdminId) {
      res.status(400).json({
        success: false,
        error: "No estás suplantando a ningún usuario",
      });
      return;
    }

    // Validar que el admin original existe
    const admin = await User.findById(impersonatedByAdminId);

    if (!admin) {
      res.status(404).json({
        success: false,
        error: "Administrador no encontrado",
      });
      return;
    }

    // Validar que el admin sigua siendo admin
    if (admin.rol !== "admin") {
      res.status(403).json({
        success: false,
        error: "El administrador original ya no tiene permisos",
      });
      return;
    }

    // Generar nuevo token con la identidad del admin (sin impersonatedBy)
    const token = generateToken(impersonatedByAdminId);

    // Responder con token y datos del admin
    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al salir de suplantación",
    });
  }
};
