import { pool } from "../config/database.js";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{3,19}$/;
const RESERVED_USERNAMES = ["admin", "root", "system", "support", "moderator"];

export const validateUsername = async (username: string) => {
    if (!username) {
        return { valid: false, message: "Username is required" };
    }

    if (!USERNAME_REGEX.test(username)) {
        return {
            valid: false,
            message:
                "Username must be 4-20 characters, start with a letter, and only contain letters, numbers, underscores, or periods.",
        };
    }

    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
        return {
            valid: false,
            message: "This username is not allowed.",
        };
    }

    const result = await pool.query(
        `SELECT id FROM "user" WHERE name = $1 LIMIT 1`,
        [username]
    );

    if (result.rows.length > 0) {
        return { valid: false, message: "Username already taken" };
    }

    return { valid: true, message: "Username is available" };
};
