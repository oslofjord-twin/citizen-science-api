import { readCsv } from "../../utils/csv.ts";

export type Achievement = {
	id: number;
	name: string;
	icon_id: number;
};

export const load = () => readCsv<Achievement>(import.meta.dirname, "achievements");
