import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { NOW } from "../../utils/date";
import fc from "fast-check";
import {
	invalidTemperatureData,
	validTemperatureData,
} from "../generators/TemperatureMeasurementDataArbitrary.generator";
import { expect } from "vitest";
import { pool } from "../../../src/config/database";

// createTemperatureMeasurement
export const validDataUpdatesDatabase = fc.asyncProperty(validTemperatureData(NOW), async (validData) => {
	const results = await createTemperatureMeasurement(validData);
});

export const invalidDataDoesntUpdateDatabase = fc.asyncProperty(invalidTemperatureData(NOW), async (invalidData) => {
	const results = await createTemperatureMeasurement(invalidData);

	const userResults = await pool.query(`
        SELECT total_points
        FROM "user"
    `);

	const measurementResults = await pool.query(`
        SELECT id
        FROM measurements	
    `);

	const temperatureDataResults = await pool.query(`
        SELECT id
        FROM temperature_data
    `);

	const userAchievementResults = await pool.query(`
        SELECT user_id
        FROM user_achievements	
    `);

	let rows = userResults.rows;
	expect(rows[0]["total_points"]).toEqual(0);

	rows = measurementResults.rows;
	expect(rows).toHaveLength(0);

	rows = temperatureDataResults.rows;
	expect(rows).toHaveLength(0);

	rows = userAchievementResults.rows;
	expect(rows).toHaveLength(0);
});

export const invalidDataThrowsError = fc.asyncProperty(invalidTemperatureData(NOW), async (invalidData) => {
	await expect(createTemperatureMeasurement(invalidData)).rejects.toThrow();
});
