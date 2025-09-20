import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as dataTypeController from "../controllers/dataTypeController.js";
const router = Router();
router.get("/data-types", authenticateUser, dataTypeController.getDataTypes);
export default router;
