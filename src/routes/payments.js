import { Router } from "express";
import Stripe from "stripe";
import { Transaction } from "../models/Transaction.js";
import { verifyToken, checkNotBlocked } from "../middleware/auth.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", verifyToken, checkNotBlocked, async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only regular users can book classes" });
    }

    const { classId, className, trainerName, price, image } = req.body;

    if (!classId || !className || !price) {
      return res.status(400).json({ message: "Missing required payment information" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: className,
              description: `Trainer: ${trainerName}`,
              images: image ? [image] : [],
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&class_id=${classId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        classId,
        className,
        price: price.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

router.get("/session/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      id: session.id,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/confirm", verifyToken, async (req, res, next) => {
  try {
    const { sessionId, classId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const existingTransaction = await Transaction.findOne({ transactionId: session.id });
    if (existingTransaction) {
      return res.json({ message: "Transaction already recorded", transaction: existingTransaction });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      userEmail: req.user.email,
      classId,
      className: session.metadata?.className || "",
      amount: session.amount_total / 100,
      transactionId: session.id,
    });

    await transaction.save();

    res.status(201).json({ message: "Payment confirmed", transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
