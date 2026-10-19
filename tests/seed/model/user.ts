import { readCsv } from "../../utils/csv";

type User = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string;
	createdAt: Date;
	updatedAt: Date;
	total_points: number;
	level: number;
	avatar_id: number;
	badge_id: number;
};

const { columns, rows } = readCsv(import.meta.dirname + "/../data", "user.csv");

const getUserById = (id: string) => {
	const user = (rows as User[]).find((row) => row.id === id);
	if (!user) throw new Error(`Could not find user with id: ${id}`);
	return user;
};

export const users = Object.freeze({
	one: getUserById("5a105e8b9d40e1329780d62ea2265d8a"),
	two: getUserById("ad0234829205b9033196ba818f7a872b"),
});
