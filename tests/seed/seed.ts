import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

export async function createSchema(c: Client) {
	const query = readFileSync(join(import.meta.dirname, "schema.sql"), "utf8");
	await c.query(query);
}

export type SeedEntry = {
	name: string;
	priority: number;
};

async function getTableNames() {
	const seedList: SeedEntry[] = JSON.parse(readFileSync(join(import.meta.dirname, "./seed-list.json"), "utf8"));
	seedList.sort((a, b) => a.priority - b.priority);
	return seedList.map((table) => table.name);
}

export async function seed(c: Client) {
	const allTables = await getTableNames();

	for (const name of allTables) {
		await c.query(`
            COPY ${name} FROM '/seed/${name}/${name}.csv' WITH (FORMAT csv, HEADER match, ENCODING 'UTF8')
        `);
	}
}

export async function empty(c: Client) {
	const { rows } = await c.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
	const tableNames = rows.map((row) => `"${row.tablename}"`).join(", ");
	if (tableNames) await c.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
}
