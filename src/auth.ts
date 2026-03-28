import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { createAuthMiddleware, APIError } from "better-auth/api";
import * as dotenv from "dotenv";

dotenv.config();

// Reqex: At least a 4 character username, at most 25 characters
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{3,24}$/;
// Regex: At least one uppercase letter, one lowercase letter, one number and one special character.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,40}$/;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const auth = betterAuth({
  database: pool,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 40,
    requireEmailVerification: false,
    autoSignIn: true,
  },

  rateLimit: {
        enabled: true,
        window: 60,
        max: 20,
        customRules: {
            "/sign-in/email": {
                window: 900,
                max: 5,
            },
        },
    },

  plugins: [
    openAPI(),
    expo(),
  ],

  user: {
    deleteUser: { enabled: true },
  },

  advanced: {
    useSecureCookies: true,
  },

  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || [],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const isSignUp = ctx.path === "/sign-up/email";
      const isChangePassword = ctx.path === "/change-password";

      if (isSignUp || isChangePassword) {
        const { name, password, newPassword, email } = ctx.body || {};
        
        const passwordToValidate = isChangePassword ? newPassword : password;

        if (!passwordToValidate || !PASSWORD_REGEX.test(passwordToValidate)) {
          throw new APIError("BAD_REQUEST", {
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
          });
        }

        if (isSignUp) {
          if (!name || !USERNAME_REGEX.test(name)) {
            throw new APIError("BAD_REQUEST", {
              message: "Username must be 4-25 characters, start with a letter, and contain only letters, numbers, underscores, or periods.",
            });
          }

          const { rows } = await pool.query(
            `SELECT 1 FROM "user" WHERE LOWER(name) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1;`,
            [name, email]
          );
          
          if (rows.length > 0) {
            throw new APIError("BAD_REQUEST", {
              message: "Username or email is already taken.",
            });
          }
        }
      }
    }),
  },
});
