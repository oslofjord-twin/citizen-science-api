import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
	calculatePoints,
	calculateLevel,
} from "../../src/services/temperaturePointsService";

describe("calculateLevel", () => {
	/*
	it("calculateLevel should always return only zero or more", () => {
		fc.assert(
			fc.property(fc.double(), (points) => {
				return calculateLevel(points) >= 0;
			}),
			{ skipAllAfterTimeLimit: 1000 },
		);
	});
	
	it("calculateLevel should return higher level the more points", () => {
		fc.assert(fc.property(fc.double(), (points) => {}));
	});

	it("calculateLevel should require more points to get to the next level", () => {
		fc.assert(fc.property(fc.double(), (points) => {}));
	});

	it("calculateLevel should handle pos/neg infinite points", () => {
		fc.assert(fc.property(fc.double(), (points) => {}));
	});
    */
});

const baseValue = 5;

describe("calculatePoints", () => {
	it("calculatePoints should return base value when receiving zero depth", () => {
		fc.assert(
			fc.property(fc.double(), (_) => {
				return calculatePoints(0) === baseValue;
			}),
		);
	});

	it("calculatePoints should always return more than zero points", () => {
		fc.assert(
			fc.property(fc.double(), (a) => {
				return calculatePoints(a) > 0;
			}),
		);
	});

	it("calculatePoints should return more points the bigger the depth", () => {
		fc.assert(
			fc.property(fc.double(), fc.double(), (a, b) => {
				fc.pre(a !== b);

				const maxValue = Math.max(a, b);
				const minValue = Math.min(a, b);

				expect(
					calculatePoints(maxValue),
				).toBeGreaterThan(calculatePoints(minValue));
			}),
			{ verbose: 2 },
		);
	});

	it("caluclatePoints should handle pos/neg infinite depth values", () => {
		fc.assert(
			fc.property(fc.double(), (a) => {
				const points = calculatePoints(a);
				return !Number.isNaN(points);
			}),
			{ examples: [[Infinity], [-Infinity], [NaN]] },
		);
	});
});
