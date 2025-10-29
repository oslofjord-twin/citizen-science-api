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
    newBadgeId: number | null;
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

    let newBadgeId: number | null = null;

    if (newLevel > current.level) {
        const badgeResult = await client.query(
            `
            SELECT id
            FROM badges
            WHERE level_required = $1
            LIMIT 1;
            `,
            [newLevel]
        );
        newBadgeId = badgeResult.rows[0]?.id || null;
    }

    await client.query(
        `
        UPDATE "user"
        SET total_points = $1,
            level = $2,
            badge_id = COALESCE($3, badge_id)
        WHERE id = $4;
        `,
        [newTotal, newLevel, newBadgeId, userId]
    );

    return {
        pointsEarned,
        totalPoints: newTotal,
        newLevel,
        newBadgeId,
    };
};
