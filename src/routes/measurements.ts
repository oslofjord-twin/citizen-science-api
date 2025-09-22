import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as measurementController from "../controllers/measurementController.js";

const router = Router();

router.post("/measurements/temperature", authenticateUser, measurementController.createTemperatureMeasurement);
router.get("/measurements", authenticateUser, measurementController.getMeasurements);

export default router;