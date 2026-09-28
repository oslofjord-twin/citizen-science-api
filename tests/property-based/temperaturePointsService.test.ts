import { describe, it } from "vitest";
import { assert } from "@fast-check/worker";
import {
	levelIsNeverNegative,
	levelIsAlwaysIncreasing,
	levelRequiresMorePoints,
	levelHandlesInfinity,
	pointsReturnsBaseValueOrMore,
	pointsIsAlwaysIncreases,
	pointsHandlesInfinity,
} from "./properties/temperaturePointsService.properties";

const settings = {
	timeout: 1000,
	verbose: 2,
};

describe("calculateLevel", { timeout: 10000 }, () => {
	it("should always return only zero or more", async () => {
		await assert(levelIsNeverNegative, settings);
	});

	it("should return higher level the more points", async () => {
		await assert(levelIsAlwaysIncreasing, settings);
	});
	it("should require more points to get to the next level", async () => {
		await assert(levelRequiresMorePoints, settings);
	});

	it("should handle pos/neg infinite points", async () => {
		await assert(levelHandlesInfinity, {
			examples: [[Infinity], [-Infinity], [NaN]],
			...settings,
		});
	});
});

describe("calculatePoints", () => {
	it("should always return base value or more", async () => {
		await assert(pointsReturnsBaseValueOrMore, settings);
	});

	it("calculatePoints should return more points the bigger the depth", async () => {
		await assert(pointsIsAlwaysIncreases, settings);
	});

	it("caluclatePoints should handle pos/neg infinite depth values", async () => {
		await assert(pointsHandlesInfinity, {
			examples: [[Infinity], [-Infinity], [NaN]],
			...settings,
		});
	});
});
