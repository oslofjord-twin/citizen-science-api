import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createTemperatureMeasurement } from "../../src/controllers/temperatureController";
import { createResponse } from "../utils/temperatureRequest";
import * as temperatureService from "../../src/services/temperatureService";
import * as geoUtil from "../../src/utils/geoUtil";
import fc from "fast-check";
import {
	validRequestBody,
	invalidRequestBody,
	validUser,
	invalidUser,
	request,
} from "./generators/temperatureController.generators";
import type { Request } from "express";

vi.mock("../../src/services/temperatureService");
vi.mock("../../src/utils/geoUtil");

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
	vi.setSystemTime(new Date());
});

afterEach(() => {
	vi.useRealTimers();
});

describe("createTemperatureMeasurement", () => {
	it("should return a response with status 201", async () => {
		await fc.assert(
			fc.asyncProperty(request(validRequestBody(Date.now()), validUser()), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(request, response);

				expect(response.status).toHaveBeenCalledWith(201);
			}),
			{
				verbose: 0,
				plugins: [
					fc.beforeEach(() => {
						vi.clearAllMocks();
					}),
				],
			},
		);
	});

	it("should reject invalid bodies with status 400", async () => {
		await fc.assert(
			fc.asyncProperty(request(invalidRequestBody(Date.now()), validUser()), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(request, response);

				expect(response.status).toHaveBeenCalledWith(400);
			}),
			{
				verbose: 0,
				plugins: [
					fc.beforeEach(() => {
						vi.clearAllMocks();
					}),
				],
			},
		);
	});

	it("should return a response with status 401 with invalid user", async () => {
		await fc.assert(
			fc.asyncProperty(request(validRequestBody(Date.now()), invalidUser()), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(request, response);

				expect(response.status).toHaveBeenCalledWith(400);
				expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(1);
			}),
			{
				verbose: 0,
				plugins: [
					fc.beforeEach(() => {
						vi.clearAllMocks();
					}),
				],
			},
		);
	});
});
