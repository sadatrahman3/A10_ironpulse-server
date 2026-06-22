import { Schema, model } from "mongoose";

const classSchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    duration: { type: String, required: true },
    schedule: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    trainerId: { type: String, required: true },
    trainerName: { type: String, required: true },
    trainerImage: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Class = model("Class", classSchema);
