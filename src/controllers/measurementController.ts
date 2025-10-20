import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as measurementService from "../services/measurementService.js";

export const getMeasurements = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { data_type, latitude, longitude, radius_km, limit = 100, offset = 0, start_date, end_date } = req.query;

        const filters = {
            data_type: data_type as string,
            latitude: latitude ? parseFloat(latitude as string) : undefined,
            longitude: longitude ? parseFloat(longitude as string) : undefined,
            radius_km: radius_km ? parseFloat(radius_km as string) : undefined,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            start_date: start_date as string,
            end_date: end_date as string
        };

        const result = await measurementService.getMeasurements(userId, filters);

        res.json({
            success: true,
            measurements: result.measurements,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Error fetching measurements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteMeasurementHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: "Measurement ID is required." });
      return;
    }

    const result = await measurementService.deleteMeasurement(userId, id);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};