import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { empty, seed } from "../seed/seed.js";
import { pool } from "../../src/config/database.js";
import { users } from "../seed/model/user.js";
import {
	createTemperatureMeasurement,
	CreateTemperatureMeasurementData,
} from "../../src/services/temperatureService.js";
import { msFromNow } from "../utils/date.js";

beforeEach(async () => {
	await empty(pool);
	await seed(pool);
});

afterAll(async () => {
	await pool.end();
});

const validData: CreateTemperatureMeasurementData = {
	userId: users.one.id,
	value_celsius: 0,
	depth_meters: 0,
	latitude: 59.884242,
	longitude: 10.654242,
	measurement_date: msFromNow(20000),
};

describe("temperatureService", () => {
	it("api-request updates the database with values from the request", async () => {
		const results = await createTemperatureMeasurement(validData);

		expect(results.user_id).toBe(users.one.id);
		expect(results.total_points).toBe(users.one.total_points + results.points_earned);

		const { rows } = await pool.query(`SELECT id FROM temperature_data WHERE id = $1`, [results.id]);
		expect(rows).toHaveLength(1);
	});
});
