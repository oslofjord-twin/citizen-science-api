import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as userController from "../controllers/userController.js";
import * as achievementsController from "../controllers/achievementsController.js";
import * as avatarController from "../controllers/avatarController.js"

const router = Router();

router.get("/user/profile", authenticateUser, userController.getUserProfile);
router.get("/user/leaderboard", authenticateUser, userController.getLeaderboard);
router.get("/user/achievements", authenticateUser, achievementsController.getUserAchievements);
router.get("/user/avatars", authenticateUser, avatarController.getAllAvatars);
router.get("/user/avatars/select", authenticateUser, avatarController.assignAvatarToUser);

export default router;