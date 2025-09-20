import { Request, Response } from "express";
import * as dataTypeService from "../services/dataTypeService.js";

export const getDataTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const dataTypes = await dataTypeService.getAllDataTypes();

    res.json({
      success: true,
      dataTypes
    });

  } catch (error) {
    console.error('Error fetching data types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
