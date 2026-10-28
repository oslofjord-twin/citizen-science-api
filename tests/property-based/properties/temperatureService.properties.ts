import { createTemperatureMeasurement } from "../../../src/services/temperatureService";
import { DAY, NOW, SECOND } from "../../utils/date";
import fc from "fast-check";
import {
	invalidTemperatureData,
	validTemperatureData,
} from "../generators/TemperatureMeasurementDataArbitrary.generator.ts";
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

export const duplicateSubmissionRewardsLessWithinADay = fc.asyncProperty(
	validTemperatureData(NOW),
	fc.integer({ min: SECOND, max: DAY }),
	async (validData, time) => {
		const { first, second } = {
			first: { ...validData, measurement_date: new Date(NOW - time).toISOString() },
			second: { ...validData, measurement_date: new Date(NOW).toISOString() },
		};
		const firstResult = await createTemperatureMeasurement(first);
		const secondResult = await createTemperatureMeasurement(second);

		const firstPointAwarded = firstResult.points_earned;
		const secondPointAwarded = secondResult.points_earned;

		expect(firstResult.id).not.toBe(secondResult.id);
		expect(firstResult.user_id).toBe(secondResult.user_id);
		expect(firstResult.latitude).toBe(secondResult.latitude);
		expect(firstResult.longitude).toBe(secondResult.longitude);
		expect(firstResult.temperature_data.value_celsius).toBe(secondResult.temperature_data.value_celsius);
		expect(firstResult.temperature_data.depth_meters).toBe(secondResult.temperature_data.depth_meters);
		return firstPointAwarded > secondPointAwarded;
	},
);

export const duplicateSubmissionRewardsTheSameAfterADay = fc.asyncProperty(
	validTemperatureData(NOW),
	fc.integer({ min: DAY }),
	async (validData, time) => {
		const { first, second } = {
			first: { ...validData, measurement_date: new Date(NOW - time).toISOString() },
			second: { ...validData, measurement_date: new Date(NOW).toISOString() },
		};
		const firstResult = await createTemperatureMeasurement(first);
		const secondResult = await createTemperatureMeasurement(second);

		const firstPointAwarded = firstResult.points_earned;
		const secondPointAwarded = secondResult.points_earned;

		expect(firstResult.id).not.toBe(secondResult.id);
		expect(firstResult.user_id).toBe(secondResult.user_id);
		expect(firstResult.latitude).toBe(secondResult.latitude);
		expect(firstResult.longitude).toBe(secondResult.longitude);
		expect(firstResult.temperature_data.value_celsius).toBe(secondResult.temperature_data.value_celsius);
		expect(firstResult.temperature_data.depth_meters).toBe(secondResult.temperature_data.depth_meters);
		return firstPointAwarded == secondPointAwarded;
	},
);
