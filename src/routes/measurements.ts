import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as measurementController from "../controllers/measurementController.js";
import * as secchiController from "../controllers/secchiController.js";

const router = Router();

router.get("/measurements", authenticateUser, measurementController.getMeasurements);
router.delete('/measurements/:id', authenticateUser, measurementController.deleteMeasurementHandler);

// Secchi measurement creation
router.post('/measurements/secchi', authenticateUser, secchiController.createSecchiMeasurement);

export default router;