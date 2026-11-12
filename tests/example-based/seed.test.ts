import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { empty, seed } from "../seed/seed.ts";
import { users } from "../seed/model/user.js";
import { badges } from "../seed/model/badges.js";
import { avatars } from "../seed/model/avatars.js";
import { achievements } from "../seed/model/achievements.js";

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

const common = {
	emailVerified: true,
	image: null,
	createdAt: new Date("2026-01-01 12:00:00.000"),
	updatedAt: new Date("2026-01-01 12:00:00.000"),
	total_points: 0,
	avatar_id: 1,
	badge_id: 1,
	failed_attempts: 0,
	lockout_until: null,
};

const seededData = {
	users: [
		{
			...common,
			id: "5a105e8b9d40e1329780d62ea2265d8a",
			name: "bob marley",
			email: "bob-marley@gmail.com",
			level: 1,
		}, // one
		{
			...common,
			id: "ad0234829205b9033196ba818f7a872b",
			name: "alice cooper",
			email: "alice-cooper@gmail.com",
			level: 1,
			avatar_id: 2,
		}, // two
		{
			...common,
			id: "8ad8757baa8564dc136c1e07507f4a98",
			name: "stevie wonder",
			email: "steview-wonder@gmail.com",
			level: 3,
		}, // three
		{
			...common,
			id: "86985e105f79b95d6bc918fb45ec7727",
			name: "micheal jackson",
			email: "micheal-jackson@gmail.com",
			level: 1,
		}, // four
		{
			...common,
			id: "e3d704f3542b44a621ebed70dc0efe13",
			name: "frank sinatra",
			email: "frank-sinatra@gmail.com",
			level: 2,
		}, // five
		{
			...common,
			id: "4cfad7076129962ee70c36839a1e3e15",
			name: "freddy mercury",
			email: "freddy-mercury@gmail.com",
			level: 3,
		}, // six
		{
			...common,
			id: "b04083e53e242626595e2b8ea327e525",
			name: "mario mario",
			email: "mario-mario@gmail.com",
			level: 1,
		}, // seven
		{
			...common,
			id: "5e40d09fa0529781afd1254a42913847",
			name: "luigi mario",
			email: "luigi-mario@gmail.com",
			level: 2,
		}, // eight
		{
			...common,
			id: "739969b53246b2c727850dbb3490ede6",
			name: "donkey kong",
			email: "donkey-kong@gmail.com",
			level: 3,
		}, // nine
		{
			...common,
			id: "c1a8e059bfd1e911cf10b626340c9a54",
			name: "mickey mouse",
			email: "mickey-mouse@gmail.com",
			level: 1,
		}, // ten
	],
	achievements: [
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
	],
	avatars: [
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
	],
	badges: [
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
	],
};

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
		const { rows } = await client.query(`SELECT * FROM "user"`);
		expect(rows).toEqual(seededData.users);
	});

	it("achievements are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM achievements ORDER BY id`);

		expect(rows).toEqual(seededData.achievements);
	});

	it("avatars are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM avatars ORDER BY id`);

		expect(rows).toEqual(seededData.avatars);
	});

	it("badges are seeded", async () => {
		const { rows } = await client.query(`SELECT * FROM badges ORDER BY id`);

		expect(rows).toEqual(seededData.badges);
	});

	it("typescript objects exists", async () => {
		// .one .two and so on is by id
		expect([
			users.one,
			users.two,
			users.three,
			users.four,
			users.five,
			users.six,
			users.seven,
			users.eight,
			users.nine,
			users.ten,
		]).toEqual(seededData.users);
		expect([
			badges.one,
			badges.two,
			badges.three,
			badges.four,
			badges.five,
			badges.six,
			badges.seven,
			badges.eight,
			badges.nine,
			badges.ten,
		]).toEqual(seededData.badges);
		expect([avatars.one, avatars.two, avatars.three]).toEqual(seededData.avatars);
		expect([achievements.one, achievements.two]).toEqual(seededData.achievements);
	});
});
