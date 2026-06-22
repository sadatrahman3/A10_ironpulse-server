import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, classId: 1 }, { unique: true });

export const Favorite = model("Favorite", favoriteSchema);
