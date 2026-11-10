import { readCsv } from "../../utils/csv";

type Achievement = {
	id: number;
	name: string;
	description: string;
	image_url: string;
	trigger_event: string;
	createdAt: Date;
	updatedAt: Date;
};

const { columns, rows } = readCsv(import.meta.dirname + "/../data", "achievements.csv");

const getAchievementById = (id: number) => {
	const achievement: Achievement | undefined = (rows as Achievement[]).find((row) => row.id === id);
	if (!achievement) throw new Error(`Could not find achievement with id: ${id}`);
	return achievement;
};

export const achievements = Object.freeze({
	one: getAchievementById(1),
	two: getAchievementById(2),
});
