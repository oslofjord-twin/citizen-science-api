import { pool } from "../config/database.js";

export interface MeasurementFilters {
  data_type?: string;
  latitude?: number;
  longitude?: number;
  limit: number;
  offset: number;
  start_date?: string;
  end_date?: string;
}

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
      m.points_earned,
      td.value_celsius,
      td.depth_meters,
      td.instrument_type,
      td.notes as temperature_notes
    FROM measurements m
    LEFT JOIN temperature_data td ON m.id = td.id
    WHERE m.user_id = $1
  `;
  
  const queryParams: any[] = [userId];
  let paramIndex = 2;

  if (filters.data_type) {
    query += ` AND m.data_type = $${paramIndex}`;
    queryParams.push(filters.data_type);
    paramIndex++;
  }

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

  query += ` ORDER BY m.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(filters.limit, filters.offset);

  const result = await pool.query(query, queryParams);

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

export const deleteMeasurement = async (userId: string, measurementId: string) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const checkResult = await client.query(
      `
      SELECT id FROM measurements
      WHERE id = $1 AND user_id = $2
      `,
      [measurementId, userId]
    );

    if (checkResult.rowCount === 0) {
      throw new Error("Measurement not found or access denied.");
    }

    await client.query(
      `DELETE FROM temperature_data WHERE id = $1`,
      [measurementId]
    );

    await client.query(
      `DELETE FROM measurements WHERE id = $1`,
      [measurementId]
    );

    await client.query("COMMIT");

    return { success: true, message: "Measurement deleted successfully." };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting measurement:", error);
    throw new Error("Failed to delete measurement.");
  } finally {
    client.release();
  }
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
