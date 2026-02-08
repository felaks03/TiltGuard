#!/usr/bin/env node

/**
 * Script para inyectar usuarios de prueba en la base de datos
 * Uso: npm run seed
 * Uso limpio: npm run seed -- --clean
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/tiltguard?authSource=admin";

interface IUsuarioEjemplo {
  nombre: string;
  email: string;
  password: string;
  rol: "usuario" | "admin";
  activo: boolean;
  telefono: string;
  ciudad: string;
  pais: string;
}

const usuariosEjemplo: IUsuarioEjemplo[] = [
  {
    nombre: "Juan Pérez",
    email: "juan@example.com",
    password: "password123",
    rol: "admin",
    activo: true,
    telefono: "+34 666 123 456",
    ciudad: "Madrid",
    pais: "España",
  },
  {
    nombre: "María García",
    email: "maria@example.com",
    password: "password123",
    rol: "usuario",
    activo: true,
    telefono: "+34 666 234 567",
    ciudad: "Barcelona",
    pais: "España",
  },
  {
    nombre: "Carlos López",
    email: "carlos@example.com",
    password: "password123",
    rol: "usuario",
    activo: true,
    telefono: "+34 666 345 678",
    ciudad: "Valencia",
    pais: "España",
  },
  {
    nombre: "Ana Rodríguez",
    email: "ana@example.com",
    password: "password123",
    rol: "usuario",
    activo: true,
    telefono: "+34 666 456 789",
    ciudad: "Sevilla",
    pais: "España",
  },
  {
    nombre: "David Martínez",
    email: "david@example.com",
    password: "password123",
    rol: "usuario",
    activo: true,
    telefono: "+34 666 567 890",
    ciudad: "Bilbao",
    pais: "España",
  },
];

async function seedDatabase(): Promise<void> {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);

    // Limpiar usuarios existentes (opcional)
    const confirm = process.argv[2] === "--clean";
    if (confirm) {
      await User.deleteMany({});
    }

    // Insertar nuevos usuarios
    const usuariosCreados = await User.insertMany(usuariosEjemplo);

    // Mostrar resumen
    usuariosCreados.forEach((user, index) => {});

    process.exit(0);
  } catch (error) {
    const err = error as any;
    if (err.code === 11000) {
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
