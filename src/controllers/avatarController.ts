import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as avatarService from "../services/avatarService.js"

export const getAllAvatars = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const avatars = await avatarService.getAllAvatars();

        if (!avatars || avatars.length === 0) {
            res.status(404).json({
                success: false,
                error: "No avatars found.",
            });
            return;
        }

        res.json({
            success: true,
            avatars,
        });
    } catch (error) {
        console.error("Error fetching avatars:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

export const assignAvatarToUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { avatarId } = req.body;

        if (!avatarId) {
            res.status(400).json({
                success: false,
                error: "avatarId is required",
            });
            return;
        }

        await avatarService.assignAvatarToUser(userId, Number(avatarId));

        res.json({
            success: true,
            message: "Avatar successfully assigned to user.",
        });
    } catch (error) {
        console.error("Error assigning avatar:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
