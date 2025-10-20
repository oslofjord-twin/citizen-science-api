import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import * as dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
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
    deleteUser: { enabled: true },
  },

  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: [process.env.TRUSTED_ORIGINS!],

  hooks: {
    async beforeUserCreated(context, userData) {
      const { email, name, password } = userData;

      // Validate username format
      if (!name || !USERNAME_REGEX.test(name)) {
        throw new Error(
          "Username must be 4-20 characters, start with a letter, and contain only letters, numbers, underscores, or periods."
        );
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // Ensure username and email are unique
      const existing = await context.db.query(
        `SELECT 1 FROM "user" WHERE name = $1 OR email = $2 LIMIT 1`,
        [name, email]
      );
      if (existing.rowCount > 0) {
        throw new Error("Username or email is already taken.");
      }

      return userData;
    },
  },
});
