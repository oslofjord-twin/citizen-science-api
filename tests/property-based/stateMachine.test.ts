import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import fc from "fast-check";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed } from "../seed/seed";
import redis from "../../src/redisClient.ts";
import { appMachine } from "../extended-finite-state-machine/app.machine.ts";
import { createActor, waitFor } from "xstate";
import { getOptions, pickEvent, getData, getPath } from "../shared/stateMachine.helper.ts";

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["Date"] });
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

describe("stateMachine", () => {
	it("should achieve 100% state coverage", async () => {
		await fc.assert(
			fc.asyncProperty(fc.gen(), async (g) => {
				console.log("START");
				const user = createActor(appMachine).start();
				for (let i = 0; i < 10; i++) {
					const snap = await waitFor(
						user,
						(s) => getOptions(getPath(s.value)) !== undefined,
						{
							timeout: 5000,
						},
					);
					const path = getPath(snap.value);
					console.log("PATH:");
					console.log(path);

					const options = getOptions(path);
					console.log("OPTIONS:");
					console.log(options);

					const event = pickEvent(options!, g);
					console.log("EVENT:");
					console.log(event);

					const data = getData(event!);
					console.log("DATA:");
					console.log(data);

					user.send(data);
					console.log("SNAP:");
					console.log(snap.value);
				}
				console.log("END");
			}),
			{ ...settings, numRuns: 2 },
		);
	});
});
