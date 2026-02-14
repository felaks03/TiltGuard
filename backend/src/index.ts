import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import blockingRoutes from "./routes/blocking";

dotenv.config();

const app: Express = express();

// Configuración de Base de Datos
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/tiltguard?authSource=admin";

// Conectar a MongoDB
mongoose.connect(MONGODB_URI).catch((_err) => {
  // MongoDB connection error
});

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://localhost:3000",
      /^chrome-extension:\/\//,
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/blocking", blockingRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

// Error handling middleware
app.use((_err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});
