import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as simulationController from "../controllers/simulationController.js";

const router = Router();

router.get("/simulation/species", authenticateUser, simulationController.getSpeciesList);
router.post("/simulation/start", authenticateUser, simulationController.startSimulation);
router.get("/simulation/status/:requestId", authenticateUser, simulationController.checkRequestStatus);
router.get("/simulation/results", authenticateUser, simulationController.getSimulationResults);

export default router;