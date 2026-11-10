import Papa from "papaparse";
import { readFileSync } from "fs";
import { join } from "path";

export const readCsv = <T>(dir: string, name: string) => {
	const csvData = readFileSync(join(dir, name), "utf-8");

	const { data, meta } = Papa.parse<T>(csvData, {
		header: true,
		dynamicTyping: true,
		skipEmptyLines: true,
	});

	const columns = meta.fields ?? [];
	const rows = data;

	return { columns, rows };
};
