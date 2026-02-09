import { Response } from "express";
import { Request } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

// Generar JWT Token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || "tu_super_secreto_seguro";
  // 7 days expiration
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
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

    // Validar longitud de contraseña
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres",
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
