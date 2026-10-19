import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { empty, seed } from "../seed/seed.ts";
import { users } from "../seed/model/user.js";

const client = new Client({ connectionString: process.env.DATABASE_URL });

beforeAll(async () => {
	await client.connect();
});

beforeEach(async () => {
	await empty(client);
	await seed(client);
});

afterAll(async () => {
	await client.end();
});

describe("temperatureService", () => {
	it("database schema is setup", async () => {
		const { rows } = await client.query(
			`SELECT table_name FROM information_schema.tables WHERe table_schema='public' ORDER BY table_name`,
		);

		console.log("ASUDHWUEGF" + users.one.id);

		expect(rows.map((e) => e.table_name)).toEqual([
			"achievements",
			"avatars",
			"badges",
			"measurements",
			"temperature_data",
			"user",
			"user_achievements",
		]);
	});
});
