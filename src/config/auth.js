import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

let client;
let authInstance;

export const initAuth = async () => {
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  authInstance = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/api/better-auth",
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          required: false,
        },
        status: {
          type: "string",
          defaultValue: "active",
          required: false,
        },
        trainerApplicationStatus: {
          type: "string",
          defaultValue: "none",
          required: false,
        },
        trainerFeedback: {
          type: "string",
          required: false,
        },
      },
    },
  });

  return authInstance;
};

export const getAuthInstance = () => authInstance;
