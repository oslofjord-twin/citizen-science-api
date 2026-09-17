import { describe, it } from "vitest";
import fc from "fast-check";
import { calculatePoints } from "../../src/services/temperaturePointsService";

describe("calculatePoints", () => {
	it("calculatePoints should return base value when receiving zero depth", () => {
		fc.assert(
			fc.property(fc.double(), (_) => {
				return calculatePoints(0) === 5;
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
				if (a === b) return true;
				const maxValue = Math.max(a, b);
				const minValue = Math.min(a, b);
				return (
					calculatePoints(maxValue) >
					calculatePoints(minValue)
				);
			}),
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
