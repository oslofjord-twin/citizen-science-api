import { describe, expect, it, afterAll } from "vitest";
import workerpool from "workerpool";
import {
	calculatePoints,
	calculateLevel,
} from "../../src/services/temperaturePointsService";

const pool = workerpool.pool();
afterAll(() => pool.terminate());

describe("calculateLevel", () => {
	it("should always return only zero or more", () => {
		expect(calculateLevel(-10000000)).greaterThanOrEqual(0);
	});

	it("should return a higher level the more points", () => {
		const pointValues = [1, 10, 100, 1000, 10000, 100000];
		const mappedValues = pointValues.map((points) => {
			return calculateLevel(points);
		});

		mappedValues.slice(1).forEach((level, i) => {
			expect(
				level,
				`points at level ${pointValues[i + 1]} should exceed points at level ${pointValues[i]}`,
			).toBeGreaterThanOrEqual(mappedValues[i]);
		});
	});

	it("should require more points to get to the next level", () => {
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
				`${count} points for level ${index + 1} should exceed points for level ${index}`,
			).toBeLessThan(levelsGrouped[index + 1]);
		});
	});

	it("should handle positive infinite points", async () => {
		const level = await pool
			.exec(calculateLevel, [Infinity])
			.timeout(1000);

		expect(level).toBeTypeOf("number");
		expect(level).not.toBeNaN();
	});

	it("should handle negative infinite points", async () => {
		const level = await pool
			.exec(calculateLevel, [-Infinity])
			.timeout(1000);

		expect(level).toBeTypeOf("number");
		expect(level).not.toBeNaN();
	});
});

describe("calculatePoints", () => {
	it("calculatePoints should return base value when receiving zero depth", () => {
		expect(calculatePoints(0)).toBe(5);
	});

	it("should always return more than zero points", () => {
		expect(calculatePoints(-1000000)).greaterThan(0);
	});

	it("should return more points the bigger the depth", () => {
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

	it("should handle positive infinite depth values", () => {
		const points = calculatePoints(Infinity);

		expect(points).toBeTypeOf("number");
		expect(points).not.toBeNaN();
	});

	it("should handle negative infinite depth values", () => {
		const points = calculatePoints(-Infinity);

		expect(points).toBeTypeOf("number");
		expect(points).not.toBeNaN();
	});
});
