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
import { validBodyRequestsGet201Response } from "./properties/temperatureController.properties";
import type { Request } from "express";
import { NOW } from "../utils/date";

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
	vi.setSystemTime(NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

const settings = {
	verbose: 1,
	plugins: [
		fc.beforeEach(() => {
			vi.clearAllMocks();
		}),
	],
};

describe("createTemperatureMeasurement", () => {
	it("should return a response with status 201", async () => {
		await fc.assert(validBodyRequestsGet201Response, settings);
	});

	it("should reject invalid bodies with status 400", async () => {
		await fc.assert(
			fc.asyncProperty(request(invalidRequestBody(NOW), validUser()), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(request, response);

				expect(response.status).toHaveBeenCalledWith(400);
			}),
			settings,
		);
	});

	it("should return a response with status 401 with invalid user", async () => {
		await fc.assert(
			fc.asyncProperty(request(validRequestBody(NOW), invalidUser()), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(request, response);

				expect(response.status).toHaveBeenCalledWith(400);
				expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(1);
			}),
			settings,
		);
	});
});
