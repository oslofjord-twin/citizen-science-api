import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { empty, seed } from "../seed/seed.js";
import { pool } from "../../src/config/database.js";
import { users } from "../seed/model/user.js";
import { CreateTemperatureMeasurementData } from "../../src/services/temperatureService.js";
import { msFromNow, NOW } from "../utils/date.js";
import { achievements } from "../seed/model/achievements.js";
import { createTemperatureMeasurement } from "../../src/services/temperatureService.js";

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

const validTemperatureMeasurmentData: CreateTemperatureMeasurementData = {
	userId: users.one.id,
	value_celsius: 0,
	depth_meters: 0,
	latitude: 59.884242,
	longitude: 10.654242,
	measurement_date: msFromNow(-20000),
	notes: "42",
};
const basePointValue = 5;
const validDataType = "temperature";

const createData = (overwrite: Record<string, unknown>): CreateTemperatureMeasurementData => ({
	...validTemperatureMeasurmentData,
	...overwrite,
});

describe("temperatureService", () => {
	it("should update / insert into the database with valid values from user first submission", async () => {
		const validData = createData({});
		const results = await createTemperatureMeasurement(validData);

		const expectedPoints = users.one.total_points + results.points_earned;

		expect(results.user_id).toBe(validData.userId);
		expect(results.total_points).toBe(expectedPoints);

		const userResults = await pool.query(`SELECT total_points FROM "user" WHERE id = $1`, [users.one.id]);
		let rows = userResults.rows;
		expect(rows).toHaveLength(1);
		expect(rows[0]["total_points"]).toBe(basePointValue);

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
			notes: validData.notes,
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

	const invalidDatas: Record<string, unknown>[] = [
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
		const key = Object.keys(rewrite)[0];
		const value = rewrite[key];
		const invalidData = createData(rewrite);

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
});
