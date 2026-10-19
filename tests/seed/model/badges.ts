import { readCsv } from "../../utils/csv";

type Badge = {
	id: number;
	name: string;
	description: string;
	image_url: string;
	level_required: number;
	createdAt: Date;
	updatedAt: Date;
};

const { columns, rows } = readCsv(import.meta.dirname + "/../data", "badges.csv");

const getBadgeById = (id: number) => {
	const badge = (rows as Badge[]).find((row) => row.id === id);
	if (!badge) throw new Error(`Could not find badge with id: ${id}`);
	return badge;
};

export const badges = Object.freeze({
	one: getBadgeById(1),
	two: getBadgeById(2),
	three: getBadgeById(3),
	four: getBadgeById(4),
	five: getBadgeById(5),
	six: getBadgeById(6),
	seven: getBadgeById(7),
	eight: getBadgeById(8),
	nine: getBadgeById(9),
	ten: getBadgeById(10),
});
