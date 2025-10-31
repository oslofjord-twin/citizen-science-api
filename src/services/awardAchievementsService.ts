import { pool } from "../config/database.js";

export const awardAchievement = async (userId: string, achievementId: number) => {
    const { rows: existing } = await pool.query(
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

    const { rows } = await pool.query(
        `
        INSERT INTO user_achievements (user_id, achievement_id, earned_at)
        VALUES ($1, $2, NOW())
        RETURNING *;
        `,
        [userId, achievementId]
    );

    return rows[0];
};

export const checkFirstSubmissionAchievement = async (userId: string) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*) AS submission_count FROM measurements WHERE user_id = $1;`,
        [userId]
    );

    const submissionCount = parseInt(rows[0].submission_count, 10);
    if (submissionCount === 1) {
        return await awardAchievement(userId, 1);
    }

    return null;
};

export const checkTenthSubmissionAchievement = async (userId: string) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*) AS submission_count FROM measurements WHERE user_id = $1;`,
        [userId]
    );

    const submissionCount = parseInt(rows[0].submission_count, 10);
    if (submissionCount === 10) {
        return await awardAchievement(userId, 2);
    }

    return null;
};


export const checkAndAwardAchievements = async (userId: string) => {
    const newlyAwarded = [];

    const firstSubmission = await checkFirstSubmissionAchievement(userId);
    if (firstSubmission) newlyAwarded.push(firstSubmission);

    const tenthSubmission = await checkTenthSubmissionAchievement(userId);
    if (tenthSubmission) newlyAwarded.push(tenthSubmission);
};
