import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as measurementController from "../controllers/measurementController.js";

const router = Router();

router.get("/measurements", authenticateUser, measurementController.getMeasurements);
router.delete('/measurements/:id', authenticateUser, measurementController.deleteMeasurementHandler);

export default router;