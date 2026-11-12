import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import redis from "../../src/redisClient.ts";
import {
	communityGoalHasGoalBasedOnNoPlayers,
	communityGoalHasGoalBasedOnPreviousWeek,
	communityGoalOnlyCountsCurrentWeek,
} from "./properties/communityGoal.properties.ts";

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
	it("should only count the current week submissions", { timeout: 20000 }, async () => {
		await fc.assert(communityGoalOnlyCountsCurrentWeek, { ...settings, numRuns: 10 });
	});

	it("should have a goal based on the overall effort from previous week", { timeout: 20000 }, async () => {
		await fc.assert(communityGoalHasGoalBasedOnPreviousWeek, { ...settings, numRuns: 10 });
	});

	it("should have a goal set for boot-strapping (when no players are there)", { timeout: 20000 }, async () => {
		await fc.assert(communityGoalHasGoalBasedOnNoPlayers, { ...settings, numRuns: 10 });
	});
});
