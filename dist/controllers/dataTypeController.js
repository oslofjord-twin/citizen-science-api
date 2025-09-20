import * as dataTypeService from "../services/dataTypeService.js";
export const getDataTypes = async (req, res) => {
    try {
        const dataTypes = await dataTypeService.getAllDataTypes();
        res.json({
            success: true,
            dataTypes
        });
    }
    catch (error) {
        console.error('Error fetching data types:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
