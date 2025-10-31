import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as userController from "../controllers/userController.js";
import * as achievementsController from "../controllers/achievementsController.js";

const router = Router();

router.get("/user/profile", authenticateUser, userController.getUserProfile);
router.get("/user/leaderboard", authenticateUser, userController.getLeaderboard);
router.get("/user/achievements", authenticateUser, achievementsController.getUserAchievements);

export default router;