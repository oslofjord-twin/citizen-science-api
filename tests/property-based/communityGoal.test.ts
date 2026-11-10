import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import {
	leaderboardIsSortedWhenFetched,
	leaderboardOpholdsGiniThreshold,
	leaderboardScoreGiniIsLessOrEqualActivityGini,
} from "./properties/leaderboard.properties.ts";
import redis from "../../src/redisClient.ts";

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
			await redis.flushall();
			await empty(pool);
			await seed(pool);
		}),
	],
};

describe("communityGoal", () => {
	it("should be sorted descending order by total_points", { timeout: 20000 }, async () => {
		await fc.assert(leaderboardIsSortedWhenFetched, { ...settings, numRuns: 10 });
	});

	it("should ophold the gini threshold", { timeout: 20000 }, async () => {
		await fc.assert(leaderboardOpholdsGiniThreshold, { ...settings, numRuns: 10 });
	});

	it("should have a gini on scores lower or equal to gini on activity", { timeout: 20000 }, async () => {
		await fc.assert(leaderboardScoreGiniIsLessOrEqualActivityGini, { ...settings, numRuns: 10 });
	});
});
