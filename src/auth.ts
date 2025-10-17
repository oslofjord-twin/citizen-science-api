import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { customSession } from "better-auth/plugins";
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
    customSession(async ({ user, session }) => {
      return {
        user: {
          ...user,
          level: user.level,
          total_points: user.total_points,
        },
        session,
      };
    }),
  ],

  user: {
    deleteUser: { enabled: true },
  },

  appName: "CitizenScienceApp",
  baseURL: process.env.BASE_URL!,
  trustedOrigins: [process.env.TRUSTED_ORIGINS!],
});
