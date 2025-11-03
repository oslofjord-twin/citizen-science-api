import { Request, Response } from "express";
import * as communityService from "../services/communityService.js";

export const getWeeklyCommunityGoal = async (req: Request, res: Response) => {
  try {
    const weeklyGoal = await communityService.getWeeklyCommunityGoal();

    res.status(200).json({
      success: true,
      weekly_goal: weeklyGoal,
    });
  } catch (error) {
    console.error("Error fetching weekly community goal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch weekly community goal.",
    });
  }
};
