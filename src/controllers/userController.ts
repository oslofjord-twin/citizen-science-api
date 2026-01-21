import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as userService from "../services/userService.js";

// Fetch the profile of the authenticated user
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const userProfile = await userService.getUserProfile(userId);

    if (!userProfile) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }

    res.json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Fetch leaderboard + user rank (optional query param ?limit=)
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    // Accepted values: "all", "week", "month"
    const timespan = (req.query.timespan as string) || "all"; 

    if (isNaN(limit) || limit <= 0) {
      res.status(400).json({ success: false, error: "Invalid limit parameter." });
      return;
    }

    const [leaderboard, currentUser] = await Promise.all([
      userService.getLeaderboard(limit, timespan),
      userService.getUserRank(userId, timespan)
    ]);

    res.json({
      success: true,
      timespan,
      leaderboard,
      currentUser: currentUser || { 
        id: userId, 
        rank: ">1000", 
        period_points: 0, 
        message: "No contributions in this period" 
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
