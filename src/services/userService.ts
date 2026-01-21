import { pool } from "../config/database.js";
import redis from "../redisClient.js";

const getInterval = (timespan: string) => {
  switch (timespan) {
    case "week": return "7 days";
    case "month": return "30 days";
    default: return null;
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
  const interval = getInterval(timespan);

  // If a timespan is provided, we sum the points_earned from the measurements table
  if (interval) {
    const result = await pool.query(
      `
      SELECT
        u.id, u.name, u.level,
        SUM(m.points_earned)::INT AS period_points,
        b.name AS badge_name, b.image_url AS badge_image_url,
        a.name AS avatar_name, a.image_url AS avatar_image_url
      FROM "user" u
      INNER JOIN measurements m ON u.id = m.user_id
      LEFT JOIN badges b ON u.badge_id = b.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE m.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY u.id, b.id, a.id
      ORDER BY period_points DESC
      LIMIT $1;
      `,
      [limit]
    );
    return result.rows;
  }

  // Default: All-time leaderboard (using total_points for performance)
  const result = await pool.query(
    `
    SELECT
      u.id, u.name, u.level,
      u.total_points AS period_points,
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
  const interval = getInterval(timespan);

  if (interval) {
    const result = await pool.query(
      `
      WITH RankedUsers AS (
        SELECT
          user_id,
          SUM(points_earned) as period_points,
          RANK() OVER (ORDER BY SUM(points_earned) DESC) AS rank
        FROM measurements
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY user_id
      )
      SELECT
        u.id, u.name, u.level,
        ru.period_points,
        ru.rank,
        b.name AS badge_name, a.name AS avatar_name
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
    SELECT ranked.*, b.name as badge_name, a.name as avatar_name FROM (
      SELECT id, name, level, total_points as period_points, badge_id, avatar_id,
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