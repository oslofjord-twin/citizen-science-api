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
	it("database schema is setup", async () => {
		const { rows } = await client.query(
			`SELECT table_name FROM information_schema.tables WHERe table_schema='public' ORDER BY table_name`,
		);

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

	it("user are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM "user" ORDER BY avatar_id`);
		expect(rows).toEqual([
			{
				id: "5a105e8b9d40e1329780d62ea2265d8a",
				name: "bob marley",
				email: "bob-marley@gmail.com",
				emailVerified: true,
				image: null,
				createdAt: new Date("2026-01-01 12:00:00.000"),
				updatedAt: new Date("2026-01-01 12:00:00.000"),
				total_points: 0,
				level: 1,
				avatar_id: 1,
				badge_id: 1,
				failed_attempts: 0,
				lockout_until: null,
			},
			{
				id: "ad0234829205b9033196ba818f7a872b",
				name: "alice cooper",
				email: "alice-cooper@gmail.com",
				emailVerified: true,
				image: null,
				createdAt: new Date("2026-01-02 12:00:00.000"),
				updatedAt: new Date("2026-01-02 12:00:00.000"),
				total_points: 0,
				level: 1,
				avatar_id: 2,
				badge_id: 1,
				failed_attempts: 0,
				lockout_until: null,
			},
		]);
	});

	it("achievements are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM achievements ORDER BY id`);

		expect(rows).toEqual([
			{
				id: 1,
				name: "First Submission",
				description: "Awarded after a users first submission",
				image_url: "https://158.39.200.23.sslip.io/static/badges/achievements/achievement-01.png",
				trigger_event: "Triggered when a user submits their first measurement",
				createdAt: new Date("2025-10-31 12:11:06.997445"),
				updatedAt: new Date("2025-10-31 12:11:06.997445"),
			},
			{
				id: 2,
				name: "10th Submission",
				description: "Awarded after a users 10th submission",
				image_url: "https://158.39.200.23.sslip.io/static/badges/achievements/achievement-02.png",
				trigger_event: "Triggered when a user submits their 10th measurement",
				createdAt: new Date("2025-10-31 12:11:45.617667"),
				updatedAt: new Date("2025-10-31 12:11:45.617667"),
			},
		]);
	});

	it("avatars are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM avatars ORDER BY id`);

		expect(rows).toEqual([
			{
				id: 1,
				name: "Avatar 1",
				description: "Avatar",
				image_url: "https://158.39.200.23.sslip.io/static/avatars/avatar-01.png",
				createdAt: new Date("2025-11-03 10:32:32.545142"),
				updatedAt: new Date("2025-11-03 10:32:32.545142"),
			},
			{
				id: 2,
				name: "Avatar 2",
				description: "Avatar",
				image_url: "https://158.39.200.23.sslip.io/static/avatars/avatar-02.png",
				createdAt: new Date("2025-11-03 10:32:32.545142"),
				updatedAt: new Date("2025-11-03 10:32:32.545142"),
			},
			{
				id: 3,
				name: "Avatar 3",
				description: "Avatar",
				image_url: "https://158.39.200.23.sslip.io/static/avatars/avatar-03.png",
				createdAt: new Date("2025-11-03 10:32:32.545142"),
				updatedAt: new Date("2025-11-03 10:32:32.545142"),
			},
		]);
	});

	it("badges are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM badges ORDER BY id`);

		expect(rows).toEqual([
			{
				id: 1,
				name: "Level 1",
				description: "Badge for reaching level 1",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-01.png",
				level_required: 1,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 2,
				name: "Level 2",
				description: "Badge for reaching level 2",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-02.png",
				level_required: 2,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 3,
				name: "Level 3",
				description: "Badge for reaching level 3",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-03.png",
				level_required: 3,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 4,
				name: "Level 4",
				description: "Badge for reaching level 4",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-04.png",
				level_required: 4,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 5,
				name: "Level 5",
				description: "Badge for reaching level 5",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-05.png",
				level_required: 5,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 6,
				name: "Level 6",
				description: "Badge for reaching level 6",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-06.png",
				level_required: 6,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 7,
				name: "Level 7",
				description: "Badge for reaching level 7",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-07.png",
				level_required: 7,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 8,
				name: "Level 8",
				description: "Badge for reaching level 8",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-08.png",
				level_required: 8,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 9,
				name: "Level 9",
				description: "Badge for reaching level 9",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-09.png",
				level_required: 9,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
			{
				id: 10,
				name: "Level 10",
				description: "Badge for reaching level 10",
				image_url: "https://158.39.200.23.sslip.io/static/badges/levels/level-10.png",
				level_required: 10,
				createdAt: new Date("2025-11-03 10:06:22.539813"),
				updatedAt: new Date("2025-11-03 10:06:22.539813"),
			},
		]);
	});
});
