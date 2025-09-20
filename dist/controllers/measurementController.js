import * as measurementService from "../services/measurementService.js";
export const createMeasurement = async (req, res) => {
    try {
        const { data_type_id, value, measurement_date, latitude, longitude, notes } = req.body;
        const userId = req.user.id;
        // Validate required fields
        if (!data_type_id || !value || !measurement_date || latitude === undefined || longitude === undefined) {
            res.status(400).json({
                error: 'Missing required fields: data_type_id, value, measurement_date, latitude, longitude'
            });
            return;
        }
        // Validate data types
        if (typeof data_type_id !== 'number' || typeof value !== 'number') {
            res.status(400).json({
                error: 'Invalid data types: data_type_id and value must be numbers'
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
        const measurement = await measurementService.createMeasurement({
            userId,
            data_type_id,
            value,
            measurement_date,
            latitude,
            longitude,
            notes
        });
        res.status(201).json({
            success: true,
            measurement
        });
    }
    catch (error) {
        console.error('Error creating measurement:', error);
        if (error instanceof Error && error.message === 'Invalid data_type_id') {
            res.status(400).json({ error: 'Invalid data_type_id' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getMeasurements = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data_type_id, limit = 100, offset = 0, start_date, end_date } = req.query;
        const filters = {
            data_type_id: data_type_id ? parseInt(data_type_id) : undefined,
            limit: parseInt(limit),
            offset: parseInt(offset),
            start_date: start_date,
            end_date: end_date
        };
        const result = await measurementService.getMeasurements(userId, filters);
        res.json({
            success: true,
            measurements: result.measurements,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('Error fetching measurements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
