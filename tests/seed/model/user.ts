import { readCsv } from "../../utils/csv";

export type User = {
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
	const user: User | undefined = (rows as User[]).find((row) => row.id === id);
	if (!user) throw new Error(`Could not find user with id: ${id}`);
	return user;
};

export const users = Object.freeze({
	one: getUserById("5a105e8b9d40e1329780d62ea2265d8a"),
	two: getUserById("ad0234829205b9033196ba818f7a872b"),
	three: getUserById("8ad8757baa8564dc136c1e07507f4a98"),
	four: getUserById("86985e105f79b95d6bc918fb45ec7727"),
	five: getUserById("e3d704f3542b44a621ebed70dc0efe13"),
	six: getUserById("4cfad7076129962ee70c36839a1e3e15"),
	seven: getUserById("b04083e53e242626595e2b8ea327e525"),
	eight: getUserById("5e40d09fa0529781afd1254a42913847"),
	nine: getUserById("739969b53246b2c727850dbb3490ede6"),
	ten: getUserById("c1a8e059bfd1e911cf10b626340c9a54"),
});

export const userIds = Object.freeze(Object.values(users).map((user) => user.id));
