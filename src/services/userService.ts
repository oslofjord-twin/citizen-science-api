import { pool } from "../config/database.js";

export const UserService = {
  async getProfile(userId: string) {
    const result = await pool.query(
      `
      SELECT id, name, total_points, level, email, createdAt
      FROM "user"
      WHERE id = $1
      `,
      [userId]
    );
    return result.rows[0];
  },
};

export const getLeaderboard = async (limit = 10) => {
  const result = await pool.query(`
    SELECT name, level, total_points
    FROM "user"
    ORDER BY total_points DESC
    LIMIT $1;
  `, [limit]);

  return result.rows;
};
