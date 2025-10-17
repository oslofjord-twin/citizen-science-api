import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();

router.get("/leaderboard", authenticateUser, measurementController.getMeasurements);

export default router;