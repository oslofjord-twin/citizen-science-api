import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { empty, seed } from "../seed/seed.js";
import { pool } from "../../src/config/database.js";
import { users } from "../seed/model/user.js";
import { DAY, HOUR, MINUTE, msFromNow, NOW, SECOND, YEAR } from "../utils/date.js";
import { achievements } from "../seed/model/achievements.js";
import { createTemperatureMeasurement } from "../../src/services/temperatureService.js";
import { createTemperatureData } from "./builders/temperature.builder.js";
import { TemperatureDataField } from "../shared/temperature.rules.js";
import { BASE_VALUE } from "../shared/calculatePoints.rules.js";

beforeEach(async () => {
	await empty(pool);
	await seed(pool);

	vi.useFakeTimers();
	vi.setSystemTime(new Date(NOW));
});

afterAll(async () => {
	await pool.end();
});

afterEach(() => {
	vi.useRealTimers();
});

const validDataType = "temperature";

describe("temperatureService", () => {
	it("should update / insert into the database with valid values from user first submission", async () => {
		const validData = createTemperatureData().build();
		const results = await createTemperatureMeasurement(validData);

		const expectedPoints = users.one.total_points + results.points_earned;

		expect(results.user_id).toBe(validData.userId);
		expect(results.total_points).toBe(expectedPoints);

		const userResults = await pool.query(`SELECT total_points FROM "user" WHERE id = $1`, [users.one.id]);
		let rows = userResults.rows;
		expect(rows).toHaveLength(1);
		expect(rows[0]["total_points"]).toBe(BASE_VALUE);

		const measurementsResults = await pool.query(`
			SELECT latitude::float8 AS latitude, longitude::float8 AS longitude, data_type, user_id, notes, points_earned 
			FROM measurements
		`); // dont need a WHERE clause since there should be only one measurement anyways
		rows = measurementsResults.rows;
		expect(rows).toHaveLength(1);
		expect(rows[0]).toEqual({
			latitude: validData.latitude,
			longitude: validData.longitude,
			data_type: validDataType,
			user_id: validData.userId,
			notes: validData.notes ?? null,
			points_earned: expectedPoints,
		});

		const temperatureDataResults = await pool.query(`
			SELECT value_celsius::float8 AS value_celsius, depth_meters::float8 AS depth_meters, notes
			FROM temperature_data
		`);
		rows = temperatureDataResults.rows;
		expect(rows).toHaveLength(1);
		expect(rows[0]).toEqual({
			value_celsius: validData.value_celsius,
			depth_meters: validData.depth_meters,
			notes: validData.notes,
		});

		const userAchievement = await pool.query(`
			SELECT user_id, achievement_id::float8 as achievement_id
			FROM user_achievements
		`);
		rows = userAchievement.rows;
		expect(rows).toHaveLength(1);
		expect(rows[0]).toEqual({
			user_id: validData.userId,
			achievement_id: achievements.one.id,
		});
	});

	const invalidDatas: Partial<Record<TemperatureDataField, unknown>>[] = [
		{ userId: "" },
		{ value_celsius: 101 },
		{ depth_meters: -1 },
		{ instrument_type: "elephant" },
		{ latitude: 91 },
		{ longitude: 181 },
		{ measurement_date: msFromNow(20000) },
		{ notes: "42".repeat(251) },
	];

	for (const rewrite of invalidDatas) {
		const key = Object.keys(rewrite)[0] as TemperatureDataField;
		const value = rewrite[key];
		const invalidData = createTemperatureData().with(key, value).build();

		it(`should throw with values ${key}: '${value}' from user submission`, async () => {
			await expect(createTemperatureMeasurement(invalidData)).rejects.toThrow();
		});

		it(`it should not update or insert into the database with values ${key}: '${value}' from user submission`, async () => {
			try {
				const results = await createTemperatureMeasurement(invalidData);
			} catch {}

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
	}

	const invalidDates = [-MINUTE * 10, -HOUR, -HOUR * 10, -DAY - SECOND];

	invalidDates.forEach((time) => {
		it(`it should reward less for duplicate submissions for resubmitting within ${(time * -1) / SECOND} seconds`, async () => {
			const first = createTemperatureData()
				.with("measurement_date", new Date(NOW + time).toISOString())
				.build();
			const second = createTemperatureData()
				.with("measurement_date", new Date(NOW).toISOString())
				.build();

			const firstResult = await createTemperatureMeasurement(first);
			const secondResult = await createTemperatureMeasurement(second);

			expect(firstResult.id).not.toBe(secondResult.id);
			expect(firstResult.user_id).toBe(secondResult.user_id);
			expect(firstResult.latitude).toBe(secondResult.latitude);
			expect(firstResult.longitude).toBe(secondResult.longitude);
			expect(firstResult.temperature_data.value_celsius).toBe(
				secondResult.temperature_data.value_celsius,
			);
			expect(firstResult.temperature_data.depth_meters).toBe(
				secondResult.temperature_data.depth_meters,
			);

			expect(secondResult.points_earned).toBeLessThan(firstResult.points_earned);
		});
	});

	const validDates = [DAY + SECOND, DAY + MINUTE, DAY + HOUR, DAY + DAY, DAY + YEAR];

	validDates.forEach((time) => {
		it(`it should reward the same for duplicate submissions for resubmitting after ${(time * -1) / SECOND} seconds`, async () => {
			const first = createTemperatureData()
				.with("measurement_date", new Date(NOW + time).toISOString())
				.build();
			const second = createTemperatureData()
				.with("measurement_date", new Date(NOW).toISOString())
				.build();

			const firstResult = await createTemperatureMeasurement(first);
			const secondResult = await createTemperatureMeasurement(second);

			expect(firstResult.id).not.toBe(secondResult.id);
			expect(firstResult.user_id).toBe(secondResult.user_id);
			expect(firstResult.latitude).toBe(secondResult.latitude);
			expect(firstResult.longitude).toBe(secondResult.longitude);
			expect(firstResult.temperature_data.value_celsius).toBe(
				secondResult.temperature_data.value_celsius,
			);
			expect(firstResult.temperature_data.depth_meters).toBe(
				secondResult.temperature_data.depth_meters,
			);

			expect(secondResult.points_earned).toBe(firstResult.points_earned);
		});
	});
});
