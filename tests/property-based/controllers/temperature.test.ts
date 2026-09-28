import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createTemperatureMeasurement } from "../../../src/controllers/temperatureController";
import { createResponse } from "../../utils/temperatureRequest";
import * as temperatureService from "../../../src/services/temperatureService";
import * as geoUtil from "../../../src/utils/geoUtil";
import fc from "fast-check";
import type { Request } from "express";

vi.mock("../../../src/services/temperatureService");
vi.mock("../../../src/utils/geoUtil");

beforeEach(() => {
	// Mocks
	vi.clearAllMocks();
	vi.mocked(geoUtil.isWithinOslofjord).mockReturnValue(true);
	vi.mocked(
		temperatureService.createTemperatureMeasurement,
	).mockResolvedValue({
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

const BOUNDS = {
	value_celsius: { min: -50, max: 100, noNan: true },
	depth_meters: { min: 0, max: 200, noNan: true },
	latitude: { min: -90, max: 90, noNan: true },
	longitude: { min: -180, max: 180, noNan: true },
	measurement_date: {
		max: new Date(Date.now() + 10 * 60 * 1000),
		noInvalidDate: true,
	},
	notes: { maxLength: 500 },
	instrument_type: ["thermometer", undefined, ""],
};

const REQUIRED_FIELDS = [
	"value_celsius",
	"depth_meters",
	"latitude",
	"longitude",
	"measurement_date",
] as const;

const inBound = ({ min, max }: { min: number; max: number }) =>
	fc.double({ min: min, max: max });
const outBound = ({ min, max }: { min: number; max: number }) =>
	fc.oneof(
		fc.double({ max: min, maxExcluded: true }),
		fc.double({ min: max, minExcluded: true }),
	);

const fieldArbs = {
	value_celsius: inBound(BOUNDS.value_celsius),
	depth_meters: inBound(BOUNDS.depth_meters),
	latitude: inBound(BOUNDS.latitude),
	longitude: inBound(BOUNDS.longitude),
	measurement_date: fc.date({ ...BOUNDS.measurement_date }),
	notes: fc.string(BOUNDS.notes),
	instrument_type: fc.constantFrom(...BOUNDS.instrument_type),
};

const requestBody = (overrides: Record<string, unknown> = {}) =>
	fc.record(
		{ ...fieldArbs, ...overrides },
		{ requiredKeys: [...REQUIRED_FIELDS] },
	);

const requestUser = () => {
	return fc.record(
		{
			id: fc.uuid(),
		},
		{ requiredKeys: ["id"] },
	);
};

const requestObj = ({
	body = requestBody(),
	user = requestUser(),
}: {
	body?: fc.Arbitrary<Record<string, unknown>>;
	user?: fc.Arbitrary<unknown>;
} = {}) => fc.record({ body, user });

const missingFieldRequestBody = () =>
	fc
		.tuple(requestBody(), fc.constantFrom(...REQUIRED_FIELDS))
		.map(([req, field]) => {
			const newReq = { ...req };
			delete newReq[field];
			return newReq;
		});

const invalidBodies: Array<[string, fc.Arbitrary<Record<string, unknown>>]> = [
	[
		"value_celsius out of bounds",
		requestObj({
			body: requestBody({
				value_celsius: outBound(BOUNDS.value_celsius),
			}),
		}),
	],
	[
		"depth_meters out of bounds",
		requestObj({
			body: requestBody({
				depth_meters: outBound(BOUNDS.depth_meters),
			}),
		}),
	],
	[
		"latitude out of bounds",
		requestObj({
			body: requestBody({
				latitude: outBound(BOUNDS.latitude),
			}),
		}),
	],
	[
		"longitude out of bounds",
		requestObj({
			body: requestBody({
				longitude: outBound(BOUNDS.longitude),
			}),
		}),
	],
	[
		"invalid measurement_date",
		requestObj({
			body: requestBody({
				measurement_date: fc.date({
					min: new Date(
						Date.now() + 10 * 60 * 1000,
					),
					noInvalidDate: false,
				}),
			}),
		}),
	],
	/*	[
		"invalid notes",
		requestObj(requestBody({ notes: fc.string(BOUNDS.notes) })),
	],*/ // whats an invalid note?
	[
		"invalid instrument_type",
		requestObj({
			body: requestBody({
				instrument_type: fc.string(),
			}),
		}),
	],
	["missing field", requestObj({ body: missingFieldRequestBody() })],
	["missing body", requestObj({ body: undefined })],
];

describe("createTemperatureMeasurement", () => {
	it("should return a response with status 201", async () => {
		await fc.assert(
			fc.asyncProperty(requestObj(), async (req) => {
				const request = req as unknown as Request;
				const response = createResponse();

				await createTemperatureMeasurement(
					request,
					response,
				);

				expect(response.status).toHaveBeenCalledWith(
					201,
				);
				expect(
					temperatureService.createTemperatureMeasurement,
				).toHaveBeenCalledTimes(1);
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

	it.each(invalidBodies)(
		"should reject %s with status 400",
		async (_desc, invalidBody) => {
			await fc.assert(
				fc.asyncProperty(invalidBody, async (req) => {
					const request =
						req as unknown as Request;
					const response = createResponse();

					await createTemperatureMeasurement(
						request,
						response,
					);

					expect(
						response.status,
					).toHaveBeenCalledWith(400);
					expect(
						temperatureService.createTemperatureMeasurement,
					).toHaveBeenCalledTimes(1);
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
		},
	);

	it("should return a response with status 401 with invalid user", async () => {
		await fc.assert(
			fc.asyncProperty(
				requestObj({ user: undefined }),
				async (req) => {
					const request =
						req as unknown as Request;
					const response = createResponse();

					await createTemperatureMeasurement(
						request,
						response,
					);

					expect(
						response.status,
					).toHaveBeenCalledWith(400);
					expect(
						temperatureService.createTemperatureMeasurement,
					).toHaveBeenCalledTimes(1);
				},
			),
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
