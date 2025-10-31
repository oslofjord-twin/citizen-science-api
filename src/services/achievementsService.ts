import { pool } from "../config/database.js";

export const getUserAchievements = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      ua.user_id,
      ua.achievement_id,
      a.name AS achievement_name,
      a.description AS achievement_description,
      a.image_url AS achievement_image_url,
      ua.earned_at
    FROM user_achievements ua
    INNER JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1
    ORDER BY ua.earned_at DESC;
    `,
    [userId]
  );

  return result.rows;
};
