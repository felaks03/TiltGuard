import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  nombre: string;
  email: string;
  password: string;
  rol: "usuario" | "admin";
  activo: boolean;
  avatar?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    nombre: {
      type: String,
      required: [true, "Por favor ingresa un nombre"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Por favor ingresa un email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor ingresa un email válido",
      ],
    },
    password: {
      type: String,
      required: [true, "Por favor ingresa una contraseña"],
      select: false,
    },
    rol: {
      type: String,
      enum: ["usuario", "admin"],
      default: "usuario",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    telefono: {
      type: String,
      default: null,
    },
    direccion: {
      type: String,
      default: null,
    },
    ciudad: {
      type: String,
      default: null,
    },
    pais: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Hash password antes de guardar
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function (
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
