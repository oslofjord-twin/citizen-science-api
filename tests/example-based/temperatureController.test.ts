import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createTemperatureMeasurement } from "../../src/controllers/temperatureController";
import { createTemperatureRequest } from "./builders/temperature.builder";
import { msFromNow, NOW } from "../utils/date";
import * as temperatureService from "../../src/services/temperatureService";
import * as geoUtil from "../../src/utils/geoUtil";
import { REQUIRED_FIELDS as REQUIRED } from "../shared/temperature.rules";
import { createMockResponse } from "../shared/mockResponse";

vi.mock("../../src/services/temperatureService");
vi.mock("../../src/utils/geoUtil");

// consider making this into a accept / reject loop instead of per field loop

beforeEach(() => {
	// Mocks
	vi.clearAllMocks();
	vi.mocked(geoUtil.isWithinOslofjord).mockReturnValue(true);
	vi.mocked(temperatureService.createTemperatureMeasurement).mockResolvedValue({
		points_earned: 5,
		total_points: 50,
		level: 2,
	} as any);

	vi.useFakeTimers();
	vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("createTemperatureMeasurement", () => {
	// Temperature field
	for (const temperature of [-50, 0, 100]) {
		it(`should accept ${temperature} degrees Celsius`, async () => {
			const request = createTemperatureRequest().with("value_celsius", temperature);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(201);
		});
	}

	for (const temperature of [-Infinity, -500, -50.1, 100.1, 500, Infinity]) {
		it(`should reject ${temperature} degrees Celsius`, async () => {
			const request = createTemperatureRequest().with("value_celsius", temperature);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(400);
			expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
		});
	}

	it("should reject a missing temperature", async () => {
		const request = createTemperatureRequest().with("value_celsius", undefined);
		const response = createMockResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
	});

	// Depth meter field (current limit 200m)
	for (const depth of [0, 50, 200]) {
		it(`should accept ${depth} meter depth`, async () => {
			const request = createTemperatureRequest().with("depth_meters", depth);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(201);
		});
	}

	for (const depth of [-1, 201, 1000, Infinity]) {
		it(`should reject ${depth} meter depth`, async () => {
			const request = createTemperatureRequest().with("depth_meters", depth);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(400);
			expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
		});
	}

	it(`should reject missing meter depth`, async () => {
		const request = createTemperatureRequest().with("depth_meters", undefined);
		const response = createMockResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
	});

	// Instrument field
	it(`should accept valid instrument type, "thermometor"`, async () => {
		const request = createTemperatureRequest().with("instrument_type", "thermometor");
		const response = createMockResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(201);
	});

	it(`should accept empty field`, async () => {
		const request = createTemperatureRequest().with("instrument_type", undefined);
		const response = createMockResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(201);
	});

	it(`should reject invalid instrument type, "elephant"`, async () => {
		const request = createTemperatureRequest().with("instrument_type", "elephant");
		const response = createMockResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
	});

	// Latitude and Longitude
	for (const [latitude, longitude] of [
		[-90, 0],
		[90, 0],
		[0, -180],
		[0, 180],
		[-90, -180],
		[90, 180],
		[0, 0],
		[-0, -0],
	]) {
		it(`should accept latitude ${latitude} and longitude ${longitude}`, async () => {
			const request = createTemperatureRequest()
				.with("latitude", latitude)
				.with("longitude", longitude);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(201);
		});
	}

	for (const [latitude, longitude] of [
		[-90.1, 0],
		[90.1, 0],
		[0, -180.1],
		[0, 180.1],
		[-90.1, -180.1],
		[90.1, 180.1],
		[Infinity, 0],
		[0, Infinity],
		[-Infinity, 0],
		[0, -Infinity],
		[undefined, 0],
		[0, undefined],
		[undefined, undefined],
	]) {
		it(`should reject latitude ${latitude} and longitude ${longitude}`, async () => {
			const request = createTemperatureRequest()
				.with("latitude", latitude)
				.with("longitude", longitude);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(400);
			expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
		});
	}

	// Date field
	for (const date of [msFromNow(0), msFromNow(-1000), msFromNow(-100000)]) {
		it(`should accept date ${date}`, async () => {
			const request = createTemperatureRequest().with("measurement_date", date);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(201);
		});
	}

	for (const date of [
		undefined,
		null,
		"",
		NaN,
		"test",
		msFromNow(1 * 60 * 60 * 1000),
		msFromNow(24 * 60 * 60 * 1000),
	]) {
		it(`should reject date ${date}`, async () => {
			const request = createTemperatureRequest().with("measurement_date", date);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(400);
			expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
		});
	}

	// Missing required field
	for (const field of REQUIRED) {
		it(`should reject missing ${field} field`, async () => {
			const request = createTemperatureRequest().without(field);
			const response = createMockResponse();

			await createTemperatureMeasurement(request, response);

			expect(response.status).toHaveBeenCalledWith(400);
			expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
		});
	}
});
