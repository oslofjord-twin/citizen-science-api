import { Router } from "express";
import * as usernameValidationController from "../controllers/usernameValidationController.js";

const router = Router();

router.post("/validate-username", usernameValidationController.validateUsername);

export default router;
