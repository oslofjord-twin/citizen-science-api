import { Router} from "express";
import { getWeeklyCommunityGoal } from "../controllers/communityController.js";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();

router.get("/community/weekly-goal", authenticateUser, getWeeklyCommunityGoal);

export default router;
