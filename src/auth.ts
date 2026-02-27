import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { createAuthMiddleware, APIError } from "better-auth/api";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load env from the API project root regardless of where the process is started from.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{3,19}$/;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Better Auth requires Postgres. " +
      "Set DATABASE_URL in citizen-science-api/.env (e.g. postgres://user:pass@localhost:5432/db)."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const cleanEnvString = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") return undefined;
  return trimmed;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const computeBaseUrl = (): string => {
  const explicitBaseUrl = cleanEnvString(process.env.BASE_URL);
  if (explicitBaseUrl) {
    if (!isValidHttpUrl(explicitBaseUrl)) {
      console.warn(
        `Invalid BASE_URL provided (${explicitBaseUrl}). Falling back to derived local base URL.`
      );
    } else {
      return explicitBaseUrl;
    }
  }

  // Convenience for local development: if EXPO_PUBLIC_API_URL is set to e.g.
  // http://192.168.0.247:3000/api, derive http://192.168.0.247:3000/api/auth
  const apiUrl = cleanEnvString(process.env.EXPO_PUBLIC_API_URL);
  if (apiUrl) {
    const trimmed = apiUrl.replace(/\/+$/, "");
    const serverRoot = trimmed.replace(/\/api\/?$/, "");
    return `${serverRoot}/api/auth`;
  }

  const port = process.env.PORT || "3000";
  return `http://localhost:${port}/api/auth`;
};

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
  baseURL: computeBaseUrl(),
  trustedOrigins: (cleanEnvString(process.env.TRUSTED_ORIGINS)
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [])
    // avoid placeholder values sneaking through
    .filter((origin) => origin.toLowerCase() !== "null" && origin.toLowerCase() !== "undefined"),

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        console.log("=".repeat(60));
        console.log("🔍 Request Origin:", ctx.request?.headers.get("origin"));
        console.log("🔍 Request Path:", ctx.path);
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
