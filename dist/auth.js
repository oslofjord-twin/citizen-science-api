import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import * as dotenv from "dotenv";
dotenv.config();
export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        autoSignIn: true,
    },
    plugins: [
        username({
            minUsernameLength: 3,
            maxUsernameLength: 30,
        }),
        expo(),
    ],
    appName: "CitizenScienceApp",
    baseURL: process.env.BASE_URL,
    trustedOrigins: [process.env.TRUSTED_ORIGINS],
});
