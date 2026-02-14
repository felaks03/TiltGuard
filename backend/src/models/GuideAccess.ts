import mongoose, { Document, Schema, Model } from "mongoose";

export interface IGuideAccess extends Document {
  userId: mongoose.Types.ObjectId;
  setupCompleted: boolean;
  cooldownUntil: Date | null;
  accessUntil: Date | null;
  extensionId: string | null;
  updatedAt: Date;
  createdAt: Date;
}

const guideAccessSchema = new Schema<IGuideAccess>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    setupCompleted: {
      type: Boolean,
      default: false,
    },
    cooldownUntil: {
      type: Date,
      default: null,
    },
    accessUntil: {
      type: Date,
      default: null,
    },
    extensionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const GuideAccess: Model<IGuideAccess> = mongoose.model<IGuideAccess>(
  "GuideAccess",
  guideAccessSchema,
);

export default GuideAccess;
