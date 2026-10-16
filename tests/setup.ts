// seeding and cleanup
import { Client } from "pg";
import { createSchema } from "./seed/seed.ts";

const client = () => new Client({ connectionString: process.env.DATABASE_URL });

export async function setup() {
	const c = client();
	await c.connect();
	try {
		await createSchema(c);
	} finally {
		await c.end();
	}
}
