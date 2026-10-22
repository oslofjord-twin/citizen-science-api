import { expect } from "vitest";
import { createTemperatureMeasurement } from "../../../src/controllers/temperatureController";
import { createTemperatureResponse } from "../../example-based/builders/temperatureRequestBuilder";
import * as temperatureService from "../../../src/services/temperatureService";
import {
	validRequestBody,
	invalidRequestBody,
	validUser,
	invalidUser,
	request,
} from "../generators/TemperatureBodyArbitrary.generator";
import type { Request } from "express";
import { NOW } from "../../utils/date";
import fc from "fast-check";

// createTemperatureMeasurement
export const validBodyRequestsGet201Response = fc.asyncProperty(
	request(validRequestBody(NOW), validUser()),
	async (req) => {
		const request = req as unknown as Request;
		const response = createTemperatureResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(201);
	},
);

export const invalidBodyRequestsGet400Response = fc.asyncProperty(
	request(invalidRequestBody(NOW), validUser()),
	async (req) => {
		const request = req as unknown as Request;
		const response = createTemperatureResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
	},
);

export const invalidUserRequestsGet401Response = fc.asyncProperty(
	request(validRequestBody(NOW), invalidUser()),
	async (req) => {
		const request = req as unknown as Request;
		const response = createTemperatureResponse();

		await createTemperatureMeasurement(request, response);

		expect(response.status).toHaveBeenCalledWith(401);
		expect(temperatureService.createTemperatureMeasurement).toHaveBeenCalledTimes(0);
	},
);
