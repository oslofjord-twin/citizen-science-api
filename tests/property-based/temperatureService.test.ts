import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import {
	invalidDataDoesntUpdateDatabase,
	invalidDataThrowsError,
	validDataUpdatesDatabase,
} from "./properties/temperatureService.properties";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

afterAll(async () => {
	await pool.end();
});

afterEach(() => {
	vi.useRealTimers();
});

const settings = {
	verbose: 1,
	plugins: [
		fc.beforeEach(async () => {
			vi.clearAllMocks();
			await empty(pool);
			await seed(pool);
		}),
	],
};

describe("createTemperatureMeasurement", () => {
	it("should update the database with values from valid data", async () => {
		await fc.assert(validDataUpdatesDatabase, settings);
	});

	it("should not update the database with values from invalid data", async () => {
		await fc.assert(invalidDataDoesntUpdateDatabase, settings);
	});

	it("should throw an error with values from invalid data", async () => {
		await fc.assert(invalidDataThrowsError, settings);
	});
});
