import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js";
import * as secchiSortController from "../controllers/secchiSortController.js";
import * as secchiUploadController from "../controllers/secchiUploadController.js";

const router = Router();

router.post("/secchi/predict", authenticateUser, secchiSortController.predict);

// Object storage upload flow (client uploads directly to S3 via presigned URL)
router.post("/secchi/uploads/request", authenticateUser, secchiUploadController.requestUploadUrl);
router.post("/secchi/uploads/complete", authenticateUser, secchiUploadController.completeUpload);

export default router;
