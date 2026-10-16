import { readCsv } from "../../utils/csv.ts";

export type User = {
	id: number;
	firstname: string;
	lastname: string;
};

export const load = () => readCsv<User>(import.meta.dirname, "users");
