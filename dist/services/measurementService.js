import { pool } from "../config/database.js";
export const createMeasurement = async (data) => {
    // Verify that the data_type_id exists
    const dataTypeCheck = await pool.query('SELECT id FROM data_types WHERE id = $1', [data.data_type_id]);
    if (dataTypeCheck.rows.length === 0) {
        throw new Error('Invalid data_type_id');
    }
    // Insert the measurement
    const result = await pool.query(`INSERT INTO measurements (user_id, data_type_id, value, measurement_date, latitude, longitude, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`, [data.userId, data.data_type_id, data.value, data.measurement_date, data.latitude, data.longitude, data.notes || null]);
    return result.rows[0];
};
export const getMeasurements = async (userId, filters) => {
    let query = `
    SELECT 
      m.id,
      m.value,
      m.measurement_date,
      m.latitude,
      m.longitude,
      m.notes,
      m.created_at,
      m.updated_at,
      dt.name as data_type_name,
      dt.display_name as data_type_display_name,
      dt.unit as data_type_unit
    FROM measurements m
    JOIN data_types dt ON m.data_type_id = dt.id
    WHERE m.user_id = $1
  `;
    const queryParams = [userId];
    let paramIndex = 2;
    // Filter by data type if specified
    if (filters.data_type_id) {
        query += ` AND m.data_type_id = $${paramIndex}`;
        queryParams.push(filters.data_type_id);
        paramIndex++;
    }
    // Filter by date range if specified
    if (filters.start_date) {
        query += ` AND m.measurement_date >= $${paramIndex}`;
        queryParams.push(filters.start_date);
        paramIndex++;
    }
    if (filters.end_date) {
        query += ` AND m.measurement_date <= $${paramIndex}`;
        queryParams.push(filters.end_date);
        paramIndex++;
    }
    // Order by measurement date (newest first) and add pagination
    query += ` ORDER BY m.measurement_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(filters.limit, filters.offset);
    const result = await pool.query(query, queryParams);
    // Get total count for pagination
    const total = await getTotalCount(userId, filters);
    return {
        measurements: result.rows,
        pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: filters.offset + filters.limit < total
        }
    };
};
const getTotalCount = async (userId, filters) => {
    let countQuery = `
    SELECT COUNT(*) 
    FROM measurements m 
    WHERE m.user_id = $1
  `;
    const countParams = [userId];
    let countParamIndex = 2;
    if (filters.data_type_id) {
        countQuery += ` AND m.data_type_id = $${countParamIndex}`;
        countParams.push(filters.data_type_id);
        countParamIndex++;
    }
    if (filters.start_date) {
        countQuery += ` AND m.measurement_date >= $${countParamIndex}`;
        countParams.push(filters.start_date);
        countParamIndex++;
    }
    if (filters.end_date) {
        countQuery += ` AND m.measurement_date <= $${countParamIndex}`;
        countParams.push(filters.end_date);
    }
    const countResult = await pool.query(countQuery, countParams);
    return parseInt(countResult.rows[0].count);
};
