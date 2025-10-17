import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as measurementService from "../services/measurementService.js";

export const createTemperatureMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { value_celsius, depth_meters, instrument_type, latitude, longitude, measurement_date, notes } = req.body;
        const userId = (req as AuthenticatedRequest).user.id;

        // Validate required fields
        if (!value_celsius || !latitude || !longitude || !measurement_date) {
            res.status(400).json({
                error: 'Missing required fields: value_celsius, latitude, longitude, measurement_date'
            });
            return;
        }

        // Validate data types
        if (typeof value_celsius !== 'number') {
            res.status(400).json({
                error: 'Invalid data types: value_celsius must be a number'
            });
            return;
        }

        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            res.status(400).json({
                error: 'Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180'
            });
            return;
        }

        if (depth_meters !== undefined && typeof depth_meters !== 'number') {
            res.status(400).json({
                error: 'Invalid data type: depth_meters must be a number if provided'
            });
            return;
        }

        const measurement = await measurementService.createTemperatureMeasurement({
            userId,
            value_celsius,
            depth_meters,
            instrument_type,
            latitude,
            longitude,
            measurement_date,
            notes
        });

        res.status(201).json({
            success: true,
            measurement: measurement,
            points_earned: measurement.points_earned,
            total_points: measurement.total_points,
            level: measurement.level
        });

    } catch (error) {
        console.error('Error creating temperature measurement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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