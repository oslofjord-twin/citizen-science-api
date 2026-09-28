import fc from "fast-check";
import { propertyFor } from "@fast-check/worker";
import {
	calculateLevel,
	calculatePoints,
} from "../../../src/services/temperaturePointsService";

const property = propertyFor(new URL(import.meta.url));

// calculateLevel
export const levelIsNeverNegative = property(fc.double(), (points: number) => {
	return calculateLevel(points) >= 0;
});

export const levelIsAlwaysIncreasing = property(
	fc.double(),
	fc.double({ min: 1 }),
	(points: number, x: number) => {
		return calculateLevel(points + x) >= calculateLevel(points);
	},
);

export const levelRequiresMorePoints = property(
	fc.double(),
	fc.double(),
	(a, b) => {
		const A = calculateLevel(a);
		const B = calculateLevel(b);

		return A > B ? a > b : b > a;
	},
);

export const levelHandlesInfinity = property(fc.double(), (points) => {
	const level = calculateLevel(points);
	return !Number.isNaN(level);
});

//calculatePoints
const baseValue = 5;

export const pointsReturnsBaseValueOrMore = property(fc.double(), (depth) => {
	return calculatePoints(depth) >= baseValue;
});

export const pointsIsAlwaysIncreases = property(
	fc.double(),
	fc.double({ min: 1 }),
	(depth, x) => {
		return calculatePoints(depth + x) >= calculatePoints(depth);
	},
);

export const pointsHandlesInfinity = property(fc.double(), (depth) => {
	const points = calculatePoints(depth);
	return !Number.isNaN(points);
});
