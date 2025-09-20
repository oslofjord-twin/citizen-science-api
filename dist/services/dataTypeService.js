import { pool } from "../config/database.js";
export const getAllDataTypes = async () => {
    const result = await pool.query('SELECT id, name, display_name, unit FROM data_types ORDER BY display_name');
    return result.rows;
};
