import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/users";

dotenv.config();

const app: Express = express();

// Configuración de Base de Datos
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/tiltguard?authSource=admin";

// Conectar a MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) =>
    console.error("❌ Error de conexión a MongoDB:", err.message),
  );

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/usuarios", userRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});
