import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as achievementService from "../services/achievementsService.js";

export const getUserAchievements = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;

        const achievements = await achievementService.getUserAchievements(userId);

        if (!achievements || achievements.length === 0) {
            res.status(404).json({
                success: false,
                error: "No achievements found for this user.",
            });
            return;
        }

        res.json({
            success: true,
            achievements,
        });
    } catch (error) {
        console.error("Error fetching user achievements:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
