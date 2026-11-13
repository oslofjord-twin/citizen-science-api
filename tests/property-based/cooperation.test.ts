import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import redis from "../../src/redisClient.ts";
import {
	communityGoalIsNotPossibleToDoAlone,
	communityGoalTotalPointsIsTheSumOfEveryonesPoint,
} from "./properties/cooperation.properties.ts";

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

describe("cooperation", () => {
	it("should have total points match the sum of all players submissions", { timeout: 20000 }, async () => {
		await fc.assert(communityGoalTotalPointsIsTheSumOfEveryonesPoint, { ...settings, numRuns: 10 });
	});

	it("should not be possible to complete alone", { timeout: 20000 }, async () => {
		await fc.assert(communityGoalIsNotPossibleToDoAlone, { ...settings, numRuns: 10 });
	});
});
