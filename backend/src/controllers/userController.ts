import { Response } from "express";
import { Request } from "express";
import User from "../models/User";

// Obtener todos los usuarios
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Obtener un usuario por ID
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Crear un nuevo usuario
export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, email, password, rol } = req.body;

    const user = new User({
      nombre,
      email,
      password,
      rol: rol || "usuario",
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const err = error as any;
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// Actualizar un usuario
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const err = error as any;
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// Eliminar un usuario
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
