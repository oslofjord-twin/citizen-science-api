import { pool } from "../config/database.js";
import redis from "../redisClient.js";

export const getUserAchievements = async (userId: string) => {
  const cacheKey = `user:${userId}:achievements`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log("Cache hit - user achievements");
    revalidateUserAchievements(userId, cacheKey);
    return JSON.parse(cached);
  }

  console.log("Cache miss - querying DB for user achievements");
  const data = await queryUserAchievements(userId);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
  return data;
};

async function revalidateUserAchievements(userId: string, cacheKey: string) {
  const data = await queryUserAchievements(userId);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
}

async function queryUserAchievements(userId: string) {
  const result = await pool.query(
    `
    SELECT
      ua.id,
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
}
