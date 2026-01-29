import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as simulationService from "../services/simulationService.js";

// Handles the species list for the UI dropdown
export const getSpeciesList = async (req: Request, res: Response): Promise<void> => {
    try {
        const species = await simulationService.getAllSpecies();
        res.status(200).json({ success: true, species });
    } catch (error) {
        console.error('Error fetching species:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Validates location and starts simulation in one request
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
        res.status(400).json({ success: false, error: error.message });
    }
};

// Used for polling from the frontend
export const checkRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const status = await simulationService.checkStatus(parseInt(requestId));

        if (!status) {
            res.status(404).json({ success: false, error: "Request not found" });
            return;
        }

        res.status(200).json({ success: true, done: status.done });
    } catch (error) {
        res.status(500).json({ success: false, error: "Status check failed" });
    }
};

// Final step: Fetches full simulation data once status is 'done'
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
        res.status(500).json({ success: false, error: "Failed to fetch results" });
    }
};