import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { username, openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import * as dotenv from "dotenv";
import type { BetterAuthUser } from "better-auth";


dotenv.config();

export const auth = betterAuth({
  // Database connection
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  plugins: [
    expo(),
    openAPI(),
  ],
  user: {
    deleteUser: { 
      enabled: true
    }
  },
  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: [process.env.TRUSTED_ORIGINS!],

  events: {
    async beforeUserCreated(user: BetterAuthUser) {
      // You can add any backend restrictions here
      if (!user.name || user.name.trim().length < 3) {
        throw new Error("Username must be at least 3 characters long.");
      }
      if (user.name.length > 20) {
        throw new Error("Username must be under 20 characters long.");
      }
      if (!/^[a-zA-Z0-9_]+$/.test(user.name)) {
        throw new Error("Username may only contain letters, numbers, and underscores.");
      }
      if (/^(admin|root|system|test)$/i.test(user.name)) {
        throw new Error("That username is reserved.");
      }
    },
  },
});
