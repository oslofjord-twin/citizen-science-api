import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { empty, seed } from "../seed/seed.ts";

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

describe("seed", () => {
	it("users are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM users ORDER BY id`);

		expect(rows).toEqual([
			{ id: 1, firstname: "alice", lastname: "cooper" },
			{ id: 2, firstname: "bob", lastname: "marley" },
		]);
	});

	it("achievements are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM achievements ORDER BY id`);

		expect(rows).toEqual([
			{ id: 1, name: "first submission", icon_id: 1 },
			{ id: 2, name: "tenth submission", icon_id: 2 },
		]);
	});
});
