import { describe, it, vi, beforeEach, afterEach, afterAll } from "vitest";
import { NOW } from "../utils/date";
import { pool } from "../../src/config/database";
import { empty, seed, SEED_PASSWORD } from "../seed/seed";
import { appMachine } from "../extended-finite-state-machine/app.machine.ts";
import { createActor, waitFor } from "xstate";
import { users } from "../seed/model/user.ts";

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

describe("stateMachine", () => {
	it("should ", async () => {
		const user = createActor(appMachine);
		user.start();
		user.send({ type: "auth.logIn", email: users.one.email, password: SEED_PASSWORD });
		const snap = await waitFor(user, (s) => s.matches("authorized"), { timeout: 5000 });
		console.log(snap.value);
	});
});
