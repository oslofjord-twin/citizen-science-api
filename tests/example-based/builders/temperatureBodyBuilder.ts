import { CreateTemperatureMeasurementData } from "services/temperatureService";
import { NOW } from "../../utils/date";
import { users } from "../../seed/model/user";

export const REQUIRED = ["value_ceslius", "depth_meters", "latitude", "longitude", "measurement_date"] as const;
export const OPTIONAL = ["instrument_type", "notes"] as const;
export const FIELDS = [...REQUIRED, ...OPTIONAL] as const;

export const validTemperatureBody = {
	userId: users.one.id,
	value_celsius: 10.0,
	depth_meters: 0.0,
	latitude: 59.884242,
	longitude: 10.654242,
	measurement_date: new Date(NOW).toISOString(),
};

// big and strong :)
export class TemperatureBodyBuilder {
	constructor(private body: Record<string, unknown> = { ...validTemperatureBody }) {
		this.body = body;
	}

	withTemperature(valueCelsius: unknown): this {
		this.body.value_celsius = valueCelsius;
		return this;
	}

	withDepth(depthMeters: unknown): this {
		this.body.depth_meters = depthMeters;
		return this;
	}

	withLatitude(latitude: unknown): this {
		this.body.latitude = latitude;
		return this;
	}

	withLongitude(longitude: unknown): this {
		this.body.longitude = longitude;
		return this;
	}

	withDate(measurementDate: unknown): this {
		this.body.measurement_date = measurementDate;
		return this;
	}

	withInstrument(instrumentType: unknown): this {
		this.body.instrument_type = instrumentType;
		return this;
	}

	withNotes(notes: unknown): this {
		this.body.notes = notes;
		return this;
	}

	without(
		field: "value_celsius" | "latitude" | "longitude" | "measurement_date" | "instrument_type" | "notes",
	): this {
		delete this.body[field];
		return this;
	}
}

export const createTemperatureBody = () =>
	new TemperatureBodyBuilder() as TemperatureBodyBuilder | CreateTemperatureMeasurementData;
