import { pool } from "../../src/config/database";
import { auth } from "../../src/auth";
import { createTemperatureMeasurement, CreateTemperatureMeasurementData } from "../../src/services/temperatureService";
import {
	AvatarResult,
	ChangePasswordInput,
	DeleteMeasurementResult,
	LoginCredentials,
	MeasurementInput,
	MeasurementResult,
	Session,
	SignupCredentials,
} from "./app.types";
import { User } from "../seed/model/user";
import { assignAvatarToUser } from "services/avatarService";
import { deleteMeasurement } from "services/measurementService";

const cookieToHeaders = (cookie: string) => new Headers({ cookie });

const headersToCookie = (headers: Headers) =>
	headers
		.getSetCookie()
		.map((c) => c.split(";")[0])
		.join("; ");

const getUserIdFromCookie = async (cookie: string): Promise<string> => {
	const session = await auth.api.getSession({ headers: cookieToHeaders(cookie) });
	if (!session?.user) throw new Error("Invalid or expired session");
	return session.user.id;
};

const getUserFromDb = async (userId: string) => {
	const { rows } = await pool.query(
		`
        SELECT *
        FROM "user"
        WHERE id = $1
    `,
		[userId],
	);
	if (!rows[0]) throw new Error(`Could not find user with id: ${userId}`);
	return rows[0] as User;
};

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

export const services = {
	logIn: async (credentials: LoginCredentials): Promise<Session> => {
		const { headers } = await auth.api.signInEmail({ body: credentials, returnHeaders: true });
		const cookie = headersToCookie(headers);
		const userId = await getUserIdFromCookie(cookie);
		const user = await getUserFromDb(userId);
		return { user: user, cookie: cookie };
	},

	signUp: async (credentials: SignupCredentials): Promise<Session> => {
		const { headers } = await auth.api.signUpEmail({ body: credentials, returnHeaders: true });
		const cookie = headersToCookie(headers);
		const userId = await getUserIdFromCookie(cookie);
		const user = await getUserFromDb(userId);
		return { user: user, cookie: cookie };
	},

	signOut: async (cookie: string): Promise<void> => {
		await auth.api.signOut({ headers: cookieToHeaders(cookie) });
	},

	changePassword: async (passwords: ChangePasswordInput, cookie: string): Promise<void> => {
		await auth.api.changePassword({
			body: { ...passwords, revokeOtherSessions: false },
			headers: cookieToHeaders(cookie),
		});
	},

	deleteAccount: async (password: string, cookie: string): Promise<void> => {
		await auth.api.deleteUser({
			body: { password: password },
			headers: cookieToHeaders(cookie),
		});
	},

	submitMeasurement: async (input: MeasurementInput, cookie: string): Promise<MeasurementResult> => {
		const userId = await getUserIdFromCookie(cookie);
		const result = await createTemperatureMeasurement({
			...input,
			userId: userId,
		});
		const updatedUser = await getUserFromDb(userId);
		return { ...result, user: updatedUser };
	},

	changeAvatar: async (avatarId: string, cookie: string): Promise<AvatarResult> => {
		const userId = await getUserIdFromCookie(cookie);
		await assignAvatarToUser(userId, Number(avatarId));
		const updatedUser = await getUserFromDb(userId);
		return { user: updatedUser };
	},

	deleteMeasurement: async (measurementId: string, cookie: string): Promise<DeleteMeasurementResult> => {
		const userId = await getUserIdFromCookie(cookie);
		await deleteMeasurement(userId, measurementId);
		const updatedUser = await getUserFromDb(userId);
		return { user: updatedUser };
	},
};
