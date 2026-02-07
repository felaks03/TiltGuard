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
    console.log("✅ Conectado a MongoDB");

    // Limpiar usuarios existentes (opcional)
    const confirm = process.argv[2] === "--clean";
    if (confirm) {
      await User.deleteMany({});
      console.log("🗑️  Usuarios existentes eliminados");
    }

    // Insertar nuevos usuarios
    const usuariosCreados = await User.insertMany(usuariosEjemplo);
    console.log(`✅ ${usuariosCreados.length} usuarios creados exitosamente`);

    // Mostrar resumen
    console.log("\n📋 Usuarios creados:");
    usuariosCreados.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.nombre} (${user.email}) - Rol: ${user.rol}`,
      );
    });

    console.log("\n💡 Credenciales de acceso:");
    console.log("- Email: juan@example.com | Contraseña: password123 (Admin)");
    console.log(
      "- Email: maria@example.com | Contraseña: password123 (Usuario)",
    );

    process.exit(0);
  } catch (error) {
    const err = error as any;
    console.error("❌ Error al inyectar usuarios:", err.message);
    if (err.code === 11000) {
      console.error(
        "⚠️  Algunos usuarios ya existen. Usa --clean para limpiar primero:",
      );
      console.error("    npm run seed -- --clean");
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
