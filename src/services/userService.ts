import { pool } from "../config/database.js";
import redis from "../redisClient.js";

export const getUserProfile = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      u.id, u.name, u.email, u.total_points, u.level, u."createdAt",
      b.name AS badge_name, b.image_url AS badge_image_url,
      a.name AS avatar_name, a.image_url AS avatar_image_url
    FROM "user" u
    LEFT JOIN badges b ON u.badge_id = b.id
    LEFT JOIN avatars a ON u.avatar_id = a.id
    WHERE u.id = $1;
    `,
    [userId]
  );
  return result.rows[0];
};

/**
 * Helper to get the SQL date filter for different timespans.
 * 'week' starts on Monday (Postgres default for date_trunc).
 */
const getTimeFilter = (timespan: string) => {
  switch (timespan) {
    case "week":
      return "m.created_at >= date_trunc('week', CURRENT_DATE) AND m.created_at < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
    case "month":
      return "m.created_at >= date_trunc('month', CURRENT_DATE) AND m.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
    default:
      return null;
  }
};

export const getLeaderboard = async (limit = 10, timespan = "all") => {
  const cacheKey = `leaderboard:${timespan}:${limit}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    revalidateLeaderboard(limit, timespan, cacheKey);
    return JSON.parse(cached);
  }

  const data = await queryLeaderboard(limit, timespan);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
  return data;
};

async function revalidateLeaderboard(limit: number, timespan: string, cacheKey: string) {
  const data = await queryLeaderboard(limit, timespan);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
}

async function queryLeaderboard(limit: number, timespan: string) {
  const timeFilter = getTimeFilter(timespan);

  if (timeFilter) {
    const result = await pool.query(
      `
      SELECT
        u.id, u.name, u.level,
        COALESCE(SUM(m.points_earned), 0)::INT AS total_points,
        b.name AS badge_name, b.image_url AS badge_image_url,
        a.name AS avatar_name, a.image_url AS avatar_image_url
      FROM "user" u
      INNER JOIN measurements m ON u.id = m.user_id
      LEFT JOIN badges b ON u.badge_id = b.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE ${timeFilter}
      GROUP BY u.id, b.id, a.id
      ORDER BY total_points DESC
      LIMIT $1;
      `,
      [limit]
    );
    return result.rows;
  }

  // Default: All-time leaderboard (Pre-calculated column)
  const result = await pool.query(
    `
    SELECT
      u.id, u.name, u.level,
      u.total_points,
      b.name AS badge_name, b.image_url AS badge_image_url,
      a.name AS avatar_name, a.image_url AS avatar_image_url
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

export const getUserRank = async (userId: string, timespan = "all") => {
  const timeFilter = getTimeFilter(timespan);

  if (timeFilter) {
    const result = await pool.query(
      `
      WITH RankedUsers AS (
        SELECT
          user_id,
          SUM(points_earned) as total_points,
          RANK() OVER (ORDER BY SUM(points_earned) DESC) AS rank
        FROM measurements m
        WHERE ${timeFilter}
        GROUP BY user_id
      )
      SELECT
        u.id, u.name, u.level,
        ru.total_points,
        ru.rank,
        b.name AS badge_name, b.image_url AS badge_image_url,
        a.name AS avatar_name, a.image_url AS avatar_image_url
      FROM "user" u
      JOIN RankedUsers ru ON u.id = ru.user_id
      LEFT JOIN badges b ON u.badge_id = b.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE u.id = $1;
      `,
      [userId]
    );
    return result.rows[0] || null;
  }

  // All-time Rank
  const result = await pool.query(
    `
    SELECT ranked.*, b.name as badge_name, a.name as avatar_name, 
           b.image_url AS badge_image_url, a.image_url AS avatar_image_url 
    FROM (
      SELECT id, name, level, total_points, badge_id, avatar_id,
      RANK() OVER (ORDER BY total_points DESC) AS rank
      FROM "user"
    ) ranked
    LEFT JOIN badges b ON ranked.badge_id = b.id
    LEFT JOIN avatars a ON ranked.avatar_id = a.id
    WHERE ranked.id = $1;
    `,
    [userId]
  );
  return result.rows[0];
};