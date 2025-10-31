import { pool } from "../config/database.js";
import type { PoolClient } from "pg";


export const awardAchievement = async (
    client: PoolClient | typeof pool,
    userId: string,
    achievementId: number
) => {
    const db = client || pool;

    const { rows: existing } = await db.query(
        `
    SELECT 1
    FROM user_achievements
    WHERE user_id = $1 AND achievement_id = $2;
    `,
        [userId, achievementId]
    );

    if (existing.length > 0) {
        console.log(`User ${userId} already has achievement ${achievementId}`);
        return null;
    }

    const { rows } = await db.query(
        `
    INSERT INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES ($1, $2, NOW())
    RETURNING *;
    `,
        [userId, achievementId]
    );

    console.log(`🏆 Awarded achievement ${achievementId} to user ${userId}`);
    return rows[0];
};


export const checkFirstSubmissionAchievement = async (
    client: PoolClient | typeof pool,
    userId: string
) => {
    const db = client || pool;

    const { rows } = await db.query(
        `SELECT COUNT(*) AS submission_count FROM measurements WHERE user_id = $1;`,
        [userId]
    );

    const submissionCount = parseInt(rows[0].submission_count, 10);
    if (submissionCount === 1) {
        return await awardAchievement(db, userId, 1);
    }

    return null;
};

export const checkTenthSubmissionAchievement = async (
    client: PoolClient | typeof pool,
    userId: string
) => {
    const db = client || pool;

    const { rows } = await db.query(
        `SELECT COUNT(*) AS submission_count FROM measurements WHERE user_id = $1;`,
        [userId]
    );

    const submissionCount = parseInt(rows[0].submission_count, 10);
    if (submissionCount === 10) {
        return await awardAchievement(db, userId, 2);
    }

    return null;
};

export const checkAndAwardAchievements = async (
    client: PoolClient | typeof pool,
    userId: string
) => {
    const newlyAwarded = [];

    const firstSubmission = await checkFirstSubmissionAchievement(client, userId);
    if (firstSubmission) newlyAwarded.push(firstSubmission);

    const tenthSubmission = await checkTenthSubmissionAchievement(client, userId);
    if (tenthSubmission) newlyAwarded.push(tenthSubmission);

    return newlyAwarded;
};
