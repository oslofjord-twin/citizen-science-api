import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import { validDataUpdatesDatabase } from "./properties/temperatureService.properties.ts";

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

describe("leaderboard", () => {
	it("", async () => {});
});
