import { pool } from "../config/database.js";

export const WEEKLY_GOAL_POINTS = 10000;

export const getWeeklyCommunityGoal = async () => {
  const startOfWeekQuery = `
    SELECT date_trunc('week', CURRENT_DATE)::date AS start_date,
           (date_trunc('week', CURRENT_DATE) + interval '6 days')::date AS end_date;
  `;
  const { rows: weekRows } = await pool.query(startOfWeekQuery);
  const { start_date, end_date } = weekRows[0];

  const totalPointsQuery = `
    SELECT COALESCE(SUM(points_earned), 0) AS total_points
    FROM measurements
    WHERE created_at >= $1 AND created_at < $2;
  `;
  const { rows: totalRows } = await pool.query(totalPointsQuery, [
    start_date,
    new Date(new Date(start_date).getTime() + 7 * 24 * 60 * 60 * 1000),
  ]);

  const total_points = parseInt(totalRows[0].total_points, 10) || 0;

  const progress_percent = Math.min(
    (total_points / WEEKLY_GOAL_POINTS) * 100,
    100
  );

  return {
    goal_points: WEEKLY_GOAL_POINTS,
    current_points: total_points,
    start_date,
    end_date,
    progress_percent: Number(progress_percent.toFixed(2)),
  };
};
