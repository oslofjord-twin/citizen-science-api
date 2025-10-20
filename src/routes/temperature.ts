import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as temperatureController from "../controllers/temperatureController.js";

const router = Router();

router.post("/temperature", authenticateUser, temperatureController.createTemperatureMeasurement);

export default router;