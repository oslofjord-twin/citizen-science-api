import { User } from "../seed/model/user";

export type Session = { user: User; cookie: string };

export type AppContext = {
	user: User | null;
	cookie: string | null;
	error: string | null;
};

export type LoginCredentials = {
	email: string;
	password: string;
};

export type SignupCredentials = {
	name: string;
	email: string;
	password: string;
};

export type ChangePasswordInput = {
	currentPassword: string;
	newPassword: string;
};

export type DeleteAccountInput = {
	password: string;
};

export type MeasurementInput = Omit<CreateTemperatureMeasurementData, "userId">;

export type MeasurementResult = {
	id: any;
	latitude: any;
	longitude: any;
	timestamp: any;
	data_type: any;
	user_id: any;
	notes: any;
	created_at: any;
	points_earned: number;
	total_points: number;
	level: number;
	temperature_data: any;
	user: User; // needed to update the user in the machine
};

export type AvatarInput = {
	avatarId: string;
};

export type AvatarResult = {
	user: User;
};

export type DeleteMeasurementInput = {
	measurementId: string;
};
export type DeleteMeasurementResult = {
	user: User;
};
