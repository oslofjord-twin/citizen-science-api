import { pool } from "../config/database.js";
import redis from "../redisClient.js";

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
    `SELECT id, name, level, total_points FROM "user"
     ORDER BY total_points DESC
     LIMIT $1;`,
    [limit]
  );
  return result.rows;
}


export const getUserRank = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT id, name, level, total_points, rank
    FROM (
      SELECT id, name, level, total_points,
             RANK() OVER (ORDER BY total_points DESC) AS rank
      FROM "user"
    ) ranked_users
    WHERE id = $1;
    `,
    [userId]
  );

  return result.rows[0];
};
