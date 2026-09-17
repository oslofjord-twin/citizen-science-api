import { describe, expect, it } from "vitest";
import {
	calculatePoints,
	calculateLevel,
} from "../../src/services/temperaturePointsService";

describe("calculateLevel", () => {
	it("calculateLevel should always return only zero or more", () => {
		expect(calculateLevel(-1000000)).greaterThanOrEqual(0);
	});

	it("calculateLevel should return a higher level the more points", () => {
		const pointValues = [1, 10, 100, 1000, 10000, 100000];
		const mappedValues = pointValues.map((points) => {
			return calculateLevel(points);
		});

		expect(
			[0, 1, 2, 3, 4].every((index) => {
				return (
					mappedValues[index] <=
					mappedValues[index + 1]
				);
			}),
		).toBe(true);
	});

	it("calculateLevel should require more points to get to the next level", () => {
		const points = Array.from(
			{ length: 1000 },
			(_, index) => index,
		);
		const levels = points.map((points) => calculateLevel(points));
		const levelsGrouped = Object.entries(
			levels.reduce<Record<number, number>>(
				(groupedLevels, level) => {
					groupedLevels[level] =
						(groupedLevels[level] ?? 0) + 1;
					return groupedLevels;
				},
				{},
			),
		)
			.slice(0, -1)
			.map(([, count]) => count);

		levelsGrouped.slice(0, -1).forEach((count, index) => {
			expect(
				count,
				`${count} points for level ${index} should exceed points for level ${index}`,
			).toBeLessThan(levelsGrouped[index + 1]);
		});
	});

	/*
	it("calculateLevel should handle positive infinite points", () => {
		const level = calculateLevel(Infinity);

		expect(level).toBeTypeOf("number");
		expect(level).not.toBeNaN();
	});

	it("calculateLevel should handle negative infinite points", () => {
		const level = calculateLevel(-Infinity);

		expect(level).toBeTypeOf("number");
		expect(level).not.toBeNaN();
	});
	*/
});

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
		const points = calculatePoints(Infinity);

		expect(points).toBeTypeOf("number");
		expect(points).not.toBeNaN();
	});

	it("caluclatePoints should handle negative infinite depth values", () => {
		const points = calculatePoints(-Infinity);

		expect(points).toBeTypeOf("number");
		expect(points).not.toBeNaN();
	});
});
