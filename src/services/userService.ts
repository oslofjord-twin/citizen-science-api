import { pool } from "../config/database.js";

/**
 * Fetches a user's profile by ID
 */
export const getUserProfile = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT id, name, total_points, level, email, "createdAt"
    FROM "user"
    WHERE id = $1;
    `,
    [userId]
  );

  return result.rows[0];
};

/**
 * Fetches the leaderboard (top users by total points)
 */
export const getLeaderboard = async (limit = 10) => {
  const result = await pool.query(
    `
    SELECT name, level, total_points
    FROM "user"
    ORDER BY total_points DESC
    LIMIT $1;
    `,
    [limit]
  );

  return result.rows;
};
