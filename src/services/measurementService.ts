import { pool } from "../config/database.js";
import { v4 as uuidv4 } from 'uuid';

export interface CreateTemperatureMeasurementData {
  userId: string;
  value_celsius: number;
  depth_meters?: number;
  instrument_type?: string;
  latitude: number;
  longitude: number;
  measurement_date: string;
  notes?: string;
}

export interface MeasurementFilters {
  data_type?: string;
  latitude?: number;
  longitude?: number;
  limit: number;
  offset: number;
  start_date?: string;
  end_date?: string;
}

export const createTemperatureMeasurement = async (data: CreateTemperatureMeasurementData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Generate IDs
    const temperatureId = uuidv4();
    const measurementId = uuidv4();

    // Insert temperature data first
    const temperatureResult = await client.query(
      `INSERT INTO temperature_data (id, value_celsius, depth_meters, instrument_type, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [temperatureId, data.value_celsius, data.depth_meters || null, data.instrument_type || null, data.notes || null]
    );

    // Insert measurement reference
    const measurementResult = await client.query(
      `INSERT INTO measurements (id, latitude, longitude, timestamp, data_type, data_id, user_id, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [measurementId, data.latitude, data.longitude, data.measurement_date, 'temperature', temperatureId, data.userId, data.notes || null]
    );

    await client.query('COMMIT');

    // Return combined data
    return {
      id: measurementResult.rows[0].id,
      latitude: measurementResult.rows[0].latitude,
      longitude: measurementResult.rows[0].longitude,
      timestamp: measurementResult.rows[0].timestamp,
      data_type: measurementResult.rows[0].data_type,
      user_id: measurementResult.rows[0].user_id,
      notes: measurementResult.rows[0].notes,
      created_at: measurementResult.rows[0].created_at,
      temperature_data: temperatureResult.rows[0]
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getMeasurements = async (userId: string, filters: MeasurementFilters) => {
  let query = `
    SELECT 
      m.id,
      m.latitude,
      m.longitude,
      m.timestamp,
      m.data_type,
      m.user_id,
      m.notes as measurement_notes,
      m.quality_flag,
      m.created_at,
      m.updated_at,
      td.value_celsius,
      td.depth_meters,
      td.instrument_type,
      td.notes as temperature_notes
    FROM measurements m
    LEFT JOIN temperature_data td ON m.data_id = td.id AND m.data_type = 'temperature'
    WHERE m.user_id = $1
  `;
  
  const queryParams: any[] = [userId];
  let paramIndex = 2;

  // Filter by data type if specified
  if (filters.data_type) {
    query += ` AND m.data_type = $${paramIndex}`;
    queryParams.push(filters.data_type);
    paramIndex++;
  }

  // Filter by date range if specified
  if (filters.start_date) {
    query += ` AND m.timestamp >= $${paramIndex}`;
    queryParams.push(filters.start_date);
    paramIndex++;
  }

  if (filters.end_date) {
    query += ` AND m.timestamp <= $${paramIndex}`;
    queryParams.push(filters.end_date);
    paramIndex++;
  }

  // Order by timestamp (newest first) and add pagination
  query += ` ORDER BY m.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

const getTotalCount = async (userId: string, filters: MeasurementFilters): Promise<number> => {
  let countQuery = `
    SELECT COUNT(*) 
    FROM measurements m 
    WHERE m.user_id = $1
  `;
  const countParams: any[] = [userId];
  let countParamIndex = 2;

  if (filters.data_type) {
    countQuery += ` AND m.data_type = $${countParamIndex}`;
    countParams.push(filters.data_type);
    countParamIndex++;
  }

  if (filters.start_date) {
    countQuery += ` AND m.timestamp >= $${countParamIndex}`;
    countParams.push(filters.start_date);
    countParamIndex++;
  }

  if (filters.end_date) {
    countQuery += ` AND m.timestamp <= $${countParamIndex}`;
    countParams.push(filters.end_date);
  }

  const countResult = await pool.query(countQuery, countParams);
  return parseInt(countResult.rows[0].count);
};