import { Router } from "express";
import jwt from "jsonwebtoken";
import { getAuthInstance } from "../config/auth.js";
import { getDb } from "../config/db.js";
import { generateToken, setTokenCookie, clearTokenCookie, verifyToken } from "../middleware/auth.js";

const router = Router();

const getUserFromDb = async (userId) => {
  const db = getDb();
  return db.collection("user").findOne({ _id: userId });
};

const validatePassword = (password) => {
  if (password.length < 6) return "Password must be at least 6 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  return null;
};

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const auth = getAuthInstance();
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        image: image || "",
      },
    });

    const user = await getUserFromDb(result.user.id);

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "user",
        status: user.status || "active",
        trainerApplicationStatus: user.trainerApplicationStatus || "none",
        trainerFeedback: user.trainerFeedback || "",
      },
    });
  } catch (error) {
    if (error.message?.includes("already") || error.message?.includes("exists")) {
      return res.status(409).json({ message: "Email already registered" });
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const auth = getAuthInstance();
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    const user = await getUserFromDb(result.user.id);

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "user",
        status: user.status || "active",
        trainerApplicationStatus: user.trainerApplicationStatus || "none",
        trainerFeedback: user.trainerFeedback || "",
      },
    });
  } catch (error) {
    if (error.message?.includes("Invalid") || error.message?.includes("credential")) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await getUserFromDb(decoded.id);

        if (user) {
          return res.json({
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role || "user",
              status: user.status || "active",
              trainerApplicationStatus: user.trainerApplicationStatus || "none",
              trainerFeedback: user.trainerFeedback || "",
            },
          });
        }
      } catch (e) {
        // JWT invalid, try Better Auth session
      }
    }

    const auth = getAuthInstance();
    const session = await auth.api.getSession({ headers: req.headers });

    if (session) {
      const user = await getUserFromDb(session.user.id);
      if (user) {
        const newToken = generateToken(user);
        setTokenCookie(res, newToken);

        return res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || "user",
            status: user.status || "active",
            trainerApplicationStatus: user.trainerApplicationStatus || "none",
            trainerFeedback: user.trainerFeedback || "",
          },
        });
      }
    }

    res.status(401).json({ message: "Not authenticated" });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

export default router;
