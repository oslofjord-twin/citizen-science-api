import { describe, it, vi, beforeEach, afterEach } from "vitest";
import * as temperatureService from "../../src/services/temperatureService";
import * as geoUtil from "../../src/utils/geoUtil";
import fc from "fast-check";
import {
	invalidBodyRequestsGet400Response,
	invalidUserRequestsGet401Response,
	validBodyRequestsGet201Response,
} from "./properties/temperatureController.properties";
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
		await fc.assert(invalidBodyRequestsGet400Response, settings);
	});

	it("should return a response with status 401 with invalid user", async () => {
		await fc.assert(invalidUserRequestsGet401Response, settings);
	});
});
