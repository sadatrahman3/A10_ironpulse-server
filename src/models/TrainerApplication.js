import { Schema, model } from "mongoose";

const trainerApplicationSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userImage: { type: String, default: "" },
    experience: { type: Number, required: true },
    specialty: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

export const TrainerApplication = model("TrainerApplication", trainerApplicationSchema);
