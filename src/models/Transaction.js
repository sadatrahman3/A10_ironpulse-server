import { Schema, model } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ["paid", "refunded"], default: "paid" },
  },
  { timestamps: true }
);

export const Transaction = model("Transaction", transactionSchema);
