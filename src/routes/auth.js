import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getAuthInstance } from "../config/auth.js";
import { getDb } from "../config/db.js";
import { generateToken, setTokenCookie, clearTokenCookie, verifyToken } from "../middleware/auth.js";
import { validatePassword } from "../utils/validation.js";

const router = Router();

const getUserFromDb = async (userId) => {
  const db = getDb();
  let user = await db.collection("user").findOne({ _id: userId });
  if (!user && typeof userId === "string") {
    try {
      user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
    } catch {}
  }
  return user;
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
    if (!user) {
      console.error("Register: user created in Better Auth but not found in DB:", result.user.id);
      return res.status(500).json({ message: "Registration failed: user could not be created" });
    }

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
    console.error("Register error:", error.message);
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
    if (!user) {
      console.error("Login: user authenticated but not found in DB:", result.user.id);
      return res.status(500).json({ message: "Login failed: user record not found" });
    }

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

router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google ID token
    const tokenResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    const { email, name, picture, sub } = tokenData;
    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    // Check if user already exists
    const db = getDb();
    let user = await db.collection("user").findOne({ email });

    if (!user) {
      // Create new user via Better Auth with a random password
      const auth = getAuthInstance();
      const randomPassword = crypto.randomUUID() + "Aa1!";
      const result = await auth.api.signUpEmail({
        body: {
          name: name || email.split("@")[0],
          email,
          password: randomPassword,
          image: picture || "",
        },
      });

      user = await db.collection("user").findOne({ _id: result.user.id });
      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }
    }

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
    console.error("Google auth error:", error.message);
    next(error);
  }
});

router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

export default router;
