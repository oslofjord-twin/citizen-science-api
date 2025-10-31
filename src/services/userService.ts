import { pool } from "../config/database.js";
import redis from "../redisClient.js";

export const getUserProfile = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.total_points,
      u.level,
      u."createdAt",
      b.name AS badge_name,
      b.image_url AS badge_image_url,
      a.name AS avatar_name,
      a.image_url AS avatar_image_url
    FROM "user" u
    LEFT JOIN badges b ON u.badge_id = b.id
    LEFT JOIN avatars a ON u.avatar_id = a.id
    WHERE u.id = $1;
    `,
    [userId]
  );

  return result.rows[0];
};

export const getLeaderboard = async (limit = 10) => {
  const cacheKey = `leaderboard:${limit}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log("Cache hit");
    revalidateLeaderboard(limit, cacheKey);
    return JSON.parse(cached);
  }

  console.log("Cache miss - querying DB");
  const data = await queryLeaderboard(limit);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
  return data;
};

async function revalidateLeaderboard(limit: number, cacheKey: string) {
  const data = await queryLeaderboard(limit);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
}

async function queryLeaderboard(limit: number) {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.level,
      u.total_points,
      b.name AS badge_name,
      b.image_url AS badge_image_url,
      a.name AS avatar_name,
      a.image_url AS avatar_image_url
    FROM "user" u
    LEFT JOIN badges b ON u.badge_id = b.id
    LEFT JOIN avatars a ON u.avatar_id = a.id
    ORDER BY u.total_points DESC
    LIMIT $1;
    `,
    [limit]
  );

  return result.rows;
}


export const getUserRank = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      ranked.id,
      ranked.name,
      ranked.level,
      ranked.total_points,
      ranked.rank,
      b.name AS badge_name,
      b.image_url AS badge_image_url,
      a.name AS avatar_name,
      a.image_url AS avatar_image_url
    FROM (
      SELECT
        u.id,
        u.name,
        u.level,
        u.total_points,
        RANK() OVER (ORDER BY u.total_points DESC) AS rank,
        u.badge_id,
        u.avatar_id
      FROM "user" u
    ) ranked
    LEFT JOIN badges b ON ranked.badge_id = b.id
    LEFT JOIN avatars a ON ranked.avatar_id = a.id
    WHERE ranked.id = $1;
    `,
    [userId]
  );

  return result.rows[0];
};
