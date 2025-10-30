import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { createAuthMiddleware, APIError } from "better-auth/api";
import * as dotenv from "dotenv";

dotenv.config();

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{3,19}$/;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const auth = betterAuth({
  database: pool,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },

  plugins: [
    openAPI(),
    expo(),
  ],

  user: {
    deleteUser: { enabled: true },
  },

  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || [],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const { name, password, email } = ctx.body || {};

        if (!name || !USERNAME_REGEX.test(name)) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Username must be 4-20 characters, start with a letter, and contain only letters, numbers, underscores, or periods.",
          });
        }

        if (!password || typeof password !== "string" || password.length < 6) {
          throw new APIError("BAD_REQUEST", {
            message: "Password must be at least 6 characters long.",
          });
        }

        const { rows } = await pool.query(
          `
          SELECT 1
          FROM "user"
          WHERE LOWER(name) = LOWER($1)
             OR LOWER(email) = LOWER($2)
          LIMIT 1;
          `,
          [name, email]
        );
        
        if (rows.length > 0) {
          throw new APIError("BAD_REQUEST", {
            message: "Username or email is already taken.",
          });
        }
      }
    }),
  },
});
