import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    userId: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    trainerId: { type: String, required: true },
    className: { type: String, required: true },
    trainerName: { type: String, required: true },
    schedule: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ["paid", "refunded"], default: "paid" },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, classId: 1 }, { unique: true });

export const Booking = model("Booking", bookingSchema);
