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

  advanced: {
    useSecureCookies: false,
  },

  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: [
        "citizenscienceapp://",
        "http://158.39.200.250",
        "http://localhost:8081",
        "exp://localhost:8081",
        "*", // Temporarily allow ALL origins for debugging
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        console.log("=".repeat(60));
        console.log("🔍 Request Origin:", ctx.request?.headers.get("origin"));
        console.log("🔍 Request Referer:", ctx.request?.headers.get("referer"));
        console.log("🔍 Trusted Origins:", [
            "citizenscienceapp://",
            "http://158.39.200.250",
            "http://localhost:8081",
            "exp://localhost:8081",
            "*"
        ]);
        console.log("=".repeat(60));
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
