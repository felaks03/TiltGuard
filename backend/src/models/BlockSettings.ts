import mongoose, { Document, Schema, Model } from "mongoose";

export interface IBlockSettings extends Document {
  userId: mongoose.Types.ObjectId;
  blockRiskSettings: boolean;
  blockUntil: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

const blockSettingsSchema = new Schema<IBlockSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    blockRiskSettings: {
      type: Boolean,
      default: false,
    },
    blockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const BlockSettings: Model<IBlockSettings> = mongoose.model<IBlockSettings>(
  "BlockSettings",
  blockSettingsSchema,
);

export default BlockSettings;
