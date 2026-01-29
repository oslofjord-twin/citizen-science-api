import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as simulationService from "../services/simulationService.js";

export const getSpeciesList = async (req: Request, res: Response): Promise<void> => {
    try {
        const species = await simulationService.getAllSpecies();
        res.status(200).json({ success: true, species });
    } catch (error) {
        console.error('Error fetching species:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const startSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { latitude, longitude, species_name } = req.body;

        if (!latitude || !longitude || !species_name) {
            res.status(400).json({ success: false, error: "Missing required fields." });
            return;
        }

        const result = await simulationService.orchestrateSimulation(
            userId,
            parseFloat(latitude),
            parseFloat(longitude),
            species_name
        );

        res.status(201).json({
            success: true,
            requestId: result.requestId,
            gridId: result.gridId
        });

    } catch (error: any) {
        console.error('Simulation Start Error:', error.message);
        res.status(400).json({ success: false, error: error.message });
    }
};

export const checkRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const requestRecord = await simulationService.checkStatus(parseInt(requestId));

        if (!requestRecord) {
            res.status(404).json({ success: false, error: "Request not found" });
            return;
        }

        res.status(200).json({ 
            success: true, 
            done: requestRecord.done // Should return true after ~4 seconds
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Status check failed" });
    }
};

export const getSimulationResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId, gridId } = req.query;

        if (!requestId || !gridId) {
            res.status(400).json({ success: false, error: "Request and Grid IDs are required." });
            return;
        }

        const data = await simulationService.fetchResults(
            parseInt(requestId as string),
            parseInt(gridId as string)
        );

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ success: false, error: "Failed to fetch results" });
    }
};