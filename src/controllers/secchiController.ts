import { Request, Response } from "express";
import os from "os";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as secchiService from "../services/secchiService.js";
import * as objectStorageService from "../services/objectStorageService.js";
import * as imageInferenceService from "../services/imageInferenceService.js";
import { isWithinOslofjord } from "../utils/geoUtil.js";

// V6: configurable plausibility range for Oslofjord Secchi depths.
const getDepthBounds = () => {
    const min = Number(process.env.SECCHI_DEPTH_MIN_M || 0.1);
    const max = Number(process.env.SECCHI_DEPTH_MAX_M || 30);
    return { min, max };
};

// V8: recency window. Default: within last 7 days, no future-dated submissions.
const getRecencyWindowMs = (): number => {
    const days = Number(process.env.SECCHI_RECENCY_DAYS || 7);
    return days * 24 * 60 * 60 * 1000;
};

const mergeFlag = (existing: string | undefined, incoming: string): string => {
    if (!existing) return incoming;
    if (existing.split(",").includes(incoming)) return existing;
    return `${existing},${incoming}`;
};

export const createSecchiMeasurement = async (req: Request, res: Response): Promise<void> => {
    let tempImagePath: string | undefined;

    try {
        const { disappearance_depth, reappearance_depth, latitude, longitude, measurement_date, image_key, notes } = req.body;
        const userId = (req as AuthenticatedRequest).user.id;

        if (
            disappearance_depth == null ||
            reappearance_depth == null ||
            latitude == null ||
            longitude == null ||
            !measurement_date
        ) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: disappearance_depth, reappearance_depth, latitude, longitude, measurement_date'
            });
            return;
        }

        if (typeof disappearance_depth !== 'number' || typeof reappearance_depth !== 'number') {
            res.status(400).json({
                 success: false,
                 error: 'Invalid data types: disappearance_depth and reappearance_depth must be numbers'
            });
            return;
        }

        if (disappearance_depth <= 0 || reappearance_depth <= 0) {
            res.status(400).json({
                 success: false,
                 error: 'Both depths must be positive'
            });
            return;
        }

        // V3: standard Secchi protocol lowers the disk until it disappears at
        // d_dis, then raises it until it reappears at d_reapp. Visual adaptation
        // makes the reappearance depth shallower, so d_dis >= d_reapp.
        if (disappearance_depth < reappearance_depth) {
            res.status(400).json({
                 success: false,
                 error: 'Disappearance depth must be at least as large as reappearance depth'
            });
            return;
        }

        // V9: disappearance--reappearance gap below 5 m.
        if (disappearance_depth - reappearance_depth > 5) {
            res.status(400).json({
                 success: false,
                 error: 'Disappearance and reappearance depths differ by more than 5 m'
            });
            return;
        }

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
             res.status(400).json({
                 success: false,
                 error: 'Invalid coordinates'
             });
             return;
        }

        const isAllowed = isWithinOslofjord(latitude, longitude);
        if (!isAllowed) {
            res.status(400).json({
                 success: false,
                 error: 'Measurement outside the Oslofjord area'
            });
            return;
        }

        // ---- Server-side flag checks (V6, V8). These do not block the
        // submission; they annotate the persisted record so reviewers can
        // filter on them later.
        let quality_flag: string | undefined;

        const { min: depthMin, max: depthMax } = getDepthBounds();
        if (disappearance_depth < depthMin || reappearance_depth < depthMin ||
            disappearance_depth > depthMax || reappearance_depth > depthMax) {
            quality_flag = mergeFlag(quality_flag, "depth-range");
        }

        const parsedDate = new Date(measurement_date);
        if (Number.isNaN(parsedDate.getTime())) {
            res.status(400).json({ success: false, error: 'measurement_date is not a valid ISO timestamp' });
            return;
        }
        const now = Date.now();
        const ageMs = now - parsedDate.getTime();
        if (ageMs < 0 || ageMs > getRecencyWindowMs()) {
            quality_flag = mergeFlag(quality_flag, "timestamp-recency");
        }

        // ---- Inference-layer rules (V10 VLM gate, V11 classifier, V12 min side).
        // Only run when an image was attached. Submissions without an image_key
        // are persisted with a flag so reviewers see the missing evidence.
        let quality: number | undefined;
        let gateMeta: { vlm_score?: number; classifier_label?: string; classifier_confidence?: number } | undefined;

        if (typeof image_key === "string" && image_key.length > 0) {
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "secchi-gate-"));
            const ext = path.extname(image_key) || ".jpg";
            tempImagePath = path.join(tmpDir, `${crypto.randomUUID()}${ext}`);

            await objectStorageService.downloadToFile({ key: image_key, destPath: tempImagePath });
            const gate = await imageInferenceService.runImageGate(tempImagePath);

            if (!gate.accepted) {
                res.status(422).json({
                    success: false,
                    error: 'Image failed automated quality checks; please retake.',
                    reason: gate.reason,
                    details: {
                        width: gate.width,
                        height: gate.height,
                        vlm_score: gate.vlm_score,
                        vlm_threshold: gate.vlm_threshold,
                        classifier_label: gate.classifier_label,
                        classifier_confidence: gate.classifier_confidence,
                        classifier_threshold: gate.classifier_threshold,
                    },
                });
                return;
            }

            quality = gate.classifier_confidence;
            gateMeta = {
                vlm_score: gate.vlm_score,
                classifier_label: gate.classifier_label,
                classifier_confidence: gate.classifier_confidence,
            };
        } else {
            quality_flag = mergeFlag(quality_flag, "no-image");
        }

        const secchi_depth = (disappearance_depth + reappearance_depth) / 2;

        const measurement = await secchiService.createSecchiMeasurement({
            userId,
            secchi_depth,
            latitude,
            longitude,
            measurement_date,
            image_key,
            notes,
            quality,
            quality_flag,
        });

        res.status(201).json({
            success: true,
            measurement,
            points_earned: measurement.points_earned,
            total_points: measurement.total_points,
            pipeline: measurement.pipeline,
            inference: gateMeta,
            quality_flag,
        });

    } catch (error) {
        console.error('Error creating secchi measurement:', error);
        // Gate setup failures (missing python deps, broken script, etc.) are
        // operator-visible bugs, not internal noise — surface the message so
        // it's immediately diagnosable from the client. Anything else stays
        // behind the generic 500 to avoid leaking stack traces.
        const message = error instanceof Error ? error.message : '';
        const isGateSetup = message.startsWith('Image gate setup failure');
        res.status(500).json({
            success: false,
            error: isGateSetup ? message : 'Internal server error',
        });
    } finally {
        if (tempImagePath) {
            try {
                await fs.rm(path.dirname(tempImagePath), { recursive: true, force: true });
            } catch (cleanupErr) {
                console.warn('Failed to clean up gate temp dir:', cleanupErr);
            }
        }
    }
};
