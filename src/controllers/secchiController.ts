import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as secchiService from "../services/secchiService.js";
import { isWithinOslofjord } from "../utils/geoUtil.js";

export const createSecchiMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { secchi_depth, latitude, longitude, measurement_date, image_key, notes, quality, quality_flag } = req.body;
        const userId = (req as AuthenticatedRequest).user.id;

        if (
            secchi_depth == null ||
            latitude == null ||
            longitude == null ||
            !measurement_date
        ) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: secchi_depth, latitude, longitude, measurement_date'
            });
            return;
        }

        if (typeof secchi_depth !== 'number') {
            res.status(400).json({
                 success: false,
                 error: 'Invalid data types: secchi_depth must be a number'
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

        const measurement = await secchiService.createSecchiMeasurement({
            userId,
            secchi_depth,
            latitude,
            longitude,
            measurement_date,
            image_key,
            notes,
            quality: typeof quality === 'number' ? quality : undefined,
            quality_flag: typeof quality_flag === 'string' ? quality_flag : undefined,
        });

        res.status(201).json({
            success: true,
            measurement,
            points_earned: measurement.points_earned,
            total_points: measurement.total_points,
        });

    } catch (error) {
        console.error('Error creating secchi measurement:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
