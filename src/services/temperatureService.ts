import { pool } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import * as temperaturePointsService from "./temperaturePointsService.js";
import { checkAndAwardAchievements } from "./awardAchievementsService.js";

export interface CreateTemperatureMeasurementData {
  userId: string;
  value_celsius: number;
  depth_meters: number;
  instrument_type?: string;
  latitude: number;
  longitude: number;
  measurement_date: string;
  notes?: string;
}

export const createTemperatureMeasurement = async (data: CreateTemperatureMeasurementData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sharedId = uuidv4();

    const gamification = await temperaturePointsService.awardPoints(
      client,
      data.userId,
      data.depth_meters
    );

    const measurementResult = await client.query(
      `
      INSERT INTO measurements (
        id, latitude, longitude, timestamp, data_type, user_id, notes, points_earned
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [
        sharedId,
        data.latitude,
        data.longitude,
        data.measurement_date,
        "temperature",
        data.userId,
        data.notes || null,
        gamification.pointsEarned
      ]
    );

    const temperatureResult = await client.query(
      `
      INSERT INTO temperature_data (
        id, value_celsius, depth_meters, instrument_type, notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        sharedId,
        data.value_celsius,
        data.depth_meters,
        data.instrument_type || null,
        data.notes || null,
      ]
    );

    await checkAndAwardAchievements(client, data.userId);

    await client.query("COMMIT");

    return {
      id: measurementResult.rows[0].id,
      latitude: measurementResult.rows[0].latitude,
      longitude: measurementResult.rows[0].longitude,
      timestamp: measurementResult.rows[0].timestamp,
      data_type: measurementResult.rows[0].data_type,
      user_id: measurementResult.rows[0].user_id,
      notes: measurementResult.rows[0].notes,
      created_at: measurementResult.rows[0].created_at,
      points_earned: gamification.pointsEarned,
      total_points: gamification.totalPoints,
      level: gamification.newLevel,
      temperature_data: temperatureResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};