import { readCsv } from "../../utils/csv";

type Avatar = {
	id: number;
	name: string;
	description: string;
	image_url: string;
	createdAt: Date;
	updatedAt: Date;
};

const { columns, rows } = readCsv(import.meta.dirname + "/../data", "avatars.csv");

const getAvatarById = (id: number) => {
	const avatar: Avatar | undefined = (rows as Avatar[]).find((row) => row.id === id);
	if (!avatar) throw new Error(`Could not find avatar with id: ${id}`);
	return avatar;
};

export const avatars = Object.freeze({
	one: getAvatarById(1),
	two: getAvatarById(2),
	three: getAvatarById(3),
});
