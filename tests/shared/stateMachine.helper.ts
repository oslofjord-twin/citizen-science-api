import fc from "fast-check";
import { AppEvents, eventTree, EventWeight } from "../extended-finite-state-machine/app.events";
import { users } from "../seed/model/user";
import { SEED_PASSWORD } from "../seed/seed";
import { validTemperatureData } from "./temperature.rules";

export const getPath = (value: any): string[] => {
	if (typeof value === "string") {
		return [value];
	} else {
		return Object.entries(value).flatMap(([key, child]) => [key, ...getPath(child)]);
	}
};

export const getOptions = (path: string[]) => {
	// fix the weights
	let v: any = eventTree;
	for (const u of path) v = v?.states?.[u];
	return v?.on as EventWeight[] | undefined;
};

export const pickEvent = (options: EventWeight[], g: fc.GeneratorValue) => {
	return g(() => fc.oneof(...options.map((o) => ({ arbitrary: fc.constant(o.type), weight: o.weight }))));
};

export const getData = (type: string): any => {
	// move to arbitrary in the future
	switch (type) {
		case "auth.logIn":
			return { type, email: users.one.email, password: SEED_PASSWORD };
		case "auth.signUp":
			return { type, name: "test", email: "new@test.com", password: SEED_PASSWORD };
		case "submit.send":
			return { type, data: validTemperatureData };
		case "profile.changeAvatar":
			return { type, avatarId: "1" };
		case "profile.deleteMeasurement":
			return { type, measurementId: "1" };
		case "profile.changePassword":
			return { type, currentPassword: SEED_PASSWORD, newPassword: SEED_PASSWORD };
		case "profile.confirmDeleteAccount":
			return { type, password: SEED_PASSWORD };
		default:
			return { type };
	}
};

type Step = { from: string; event: AppEvents };
