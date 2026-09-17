import { describe, expect, it } from "vitest";
import { calculatePoints } from "../../src/services/temperaturePointsService";

describe("calculatePoints", () => {
	it("calculatePoints should return base value when receiving zero depth", () => {
		expect(calculatePoints(0)).toBe(5);
	});

	it("calculatePoints should always return more than zero points", () => {
		expect(calculatePoints(-1000000)).greaterThan(0);
	});

	it("calculatePoints should return more points the bigger the depth", () => {
		const depthValues = [1, 10, 100, 1000, 10000, 100000];
		const mappedValues = depthValues.map((depth) => {
			return calculatePoints(depth);
		});

		expect(
			[0, 1, 2, 3, 4].every((index) => {
				return (
					mappedValues[index] <
					mappedValues[index + 1]
				);
			}),
		).toBe(true);
	});

	it("caluclatePoints should handle positive infinite depth values", () => {
		const pointsNeg = calculatePoints(Infinity);

		expect(pointsNeg).toBeTypeOf("number");
		expect(pointsNeg).not.toBeNaN();
	});

	it("caluclatePoints should handle negative infinite depth values", () => {
		const pointsNeg = calculatePoints(-Infinity);

		expect(pointsNeg).toBeTypeOf("number");
		expect(pointsNeg).not.toBeNaN();
	});
});
