import type { PoolClient } from "pg";

export const calculatePoints = (depth: number): number => {
  const base = 5;
  const bonus = Math.round(depth * 1.5 - depth);
  return base + bonus;
};

export const calculateLevel = (totalPoints: number): number => {
  let level = 1;
  while (totalPoints >= 7.5 * (level - 1) * level) {
    level++;
  }
  return level - 1;
};

export const awardPoints = async (
  client: PoolClient,
  userId: string,
  depth: number
): Promise<{
  pointsEarned: number;
  totalPoints: number;
  newLevel: number;
}> => {
  const pointsEarned = calculatePoints(depth);

  const { rows } = await client.query(
    `
      SELECT total_points, level
      FROM "user"
      WHERE id = $1
      FOR UPDATE;
    `,
    [userId]
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  const current = rows[0];
  const newTotal = current.total_points + pointsEarned;
  const newLevel = calculateLevel(newTotal);

  await client.query(
    `
      UPDATE "user"
      SET total_points = $1,
          level = $2
      WHERE id = $3;
    `,
    [newTotal, newLevel, userId]
  );

  return {
    pointsEarned,
    totalPoints: newTotal,
    newLevel,
  };
};
