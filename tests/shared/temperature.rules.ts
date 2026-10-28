import { CreateTemperatureMeasurementData } from "services/temperatureService";
import { users } from "../seed/model/user";
import { DAY, MINUTE, NOW, YEAR } from "../utils/date";

export const TEMPERATURE_BOUNDS = {
	userIds: [users.one.id, users.two.id],
	value_celsius: { min: -50, max: 100 },
	depth_meters: { min: 0, max: 200 },
	latitude: { min: -90, max: 90 },
	longitude: { min: -180, max: 180 },
	measurement_date: { min: -2 * YEAR, max: 10 * MINUTE },
	notes: { maxLength: 500, size: "max" },
	instrument_type: ["thermometer", undefined, ""],
} as const;

export const NUMBER_FIELDS = ["value_celsius", "depth_meters", "latitude", "longitude"] as const;
export const REQUIRED_FIELDS = [...NUMBER_FIELDS, "measurement_date"] as const;
export const OPTIONAL_FIELDS = ["instrument_type", "notes"] as const;
export const ALL_FIELDS = [
	...REQUIRED_FIELDS,
	...OPTIONAL_FIELDS,
] as const satisfies readonly (keyof TemperatureBody)[];

export type TemperatureField = (typeof ALL_FIELDS)[number];
export type TemperatureDataField = TemperatureField | "userId";

export type TemperatureBody = {
	value_celsius: number;
	depth_meters: number;
	latitude: number;
	longitude: number;
	measurement_date: string;
	instrument_type?: string | undefined;
	notes?: string | undefined;
};

export const validTemperatureBody: TemperatureBody = {
	value_celsius: 10.0,
	depth_meters: 0.0,
	latitude: 59.884242,
	longitude: 10.654242,
	measurement_date: new Date(NOW).toISOString(),
};

export const validTemperatureData = {
	userId: users.one.id,
	...validTemperatureBody,
} satisfies CreateTemperatureMeasurementData;
