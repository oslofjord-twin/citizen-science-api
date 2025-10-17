import { Request, Response } from "express";
import * as usernameValidationService from "../services/usernameValidationService.js";

export const validateUsername = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.body;

        const result = await usernameValidationService.validateUsername(username);

        if (!result.valid) {
            const status =
                result.message === "Username already taken" ? 409 : 400;

            res.status(status).json({
                success: false,
                ...result,
            });
            return;
        }

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Error validating username:", error);
        res.status(500).json({
            success: false,
            valid: false,
            message: "Internal server error",
        });
    }
};
