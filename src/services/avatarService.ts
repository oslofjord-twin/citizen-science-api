import { pool } from "../config/database.js";

export const getAllAvatars = async () => {
    const result = await pool.query(
        `
    SELECT
      id,
      name,
      description,
      image_url,
      "createdAt",
      "updatedAt"
    FROM avatars
    ORDER BY id ASC;
    `
    );

    return result.rows;
};

export const assignAvatarToUser = async (userId: string, avatarId: number) => {
    const { rows: avatarRows } = await pool.query(
        `SELECT id FROM avatars WHERE id = $1;`,
        [avatarId]
    );

    if (avatarRows.length === 0) {
        throw new Error(`Avatar with id ${avatarId} does not exist.`);
    }

    const { rows: updatedUser } = await pool.query(
        `
    UPDATE "user"
    SET avatar_id = $1,
        "updatedAt" = NOW()
    WHERE id = $2
    RETURNING id, name, avatar_id;
    `,
        [avatarId, userId]
    );

    if (updatedUser.length === 0) {
        throw new Error("User not found");
    }

    return updatedUser[0];
};