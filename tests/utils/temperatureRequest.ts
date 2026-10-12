import { vi } from "vitest";
import type { Request, Response } from "express";

export const createResponse = () => {
	const res = {
		status: vi.fn().mockName("res.status"),
		json: vi.fn().mockName("res.json"),
		send: vi.fn().mockName("res.send"),
	};
	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	res.send.mockReturnValue(res);
	return res as unknown as Response & typeof res;
};

export const validTemperatureBody = {
	value_celsius: 10.0,
	latitude: 59.884242,
	longitude: 10.654242,
	measurement_date: "2026-09-01",
};

class TemperatureRequestBuilder {
	body: Record<string, unknown> = { ...validTemperatureBody };
	user: { id: unknown } | undefined = { id: "test-user-id" };

	withNoUser(): this {
		this.user = undefined;
		return this;
	}

	withUserId(userId: unknown): this {
		this.user = { id: userId };
		return this;
	}

	withTemperature(valueCelsius: unknown): this {
		this.body.value_celsius = valueCelsius;
		return this;
	}

	withDepth(depthMeters: unknown): this {
		this.body.depth_meters = depthMeters;
		return this;
	}

	withInstrument(instrumentType: unknown): this {
		this.body.instrument_type = instrumentType;
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

	withNotes(notes: unknown): this {
		this.body.notes = notes;
		return this;
	}
}

export const createRequest = () =>
	new TemperatureRequestBuilder() as TemperatureRequestBuilder & Request;
