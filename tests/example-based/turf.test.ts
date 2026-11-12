import { multiLineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { describe, it, expect } from "vitest";

type Coordinate = [number, number];

describe("turf", () => {
	it("point outside of polygon gives 222390m", () => {
		const polygon = multiLineString([
			[
				[0, 0],
				[2, 0],
				[2, 2],
				[0, 2],
				[0, 0],
			] as Coordinate[],
		]);
		const p1 = point([0, 4]);
		const p2 = point([1, 4]);

		const distance1 = nearestPointOnLine(polygon, p1, { units: "meters" }).properties.pointDistance;
		const distance2 = nearestPointOnLine(polygon, p2, { units: "meters" }).properties.pointDistance;

		expect(distance1).toBeCloseTo(222390, 0);
		expect(distance2).toBeCloseTo(distance1, 50);
	});

	it("point inside of polygon gives 222390m", () => {
		const polygon = multiLineString([
			[
				[0, 0],
				[0, 5],
				[5, 5],
				[5, 0],
				[0, 0],
			] as Coordinate[],
		]);
		const p1 = point([2.5, 2]);
		const p2 = point([2.5, -2]);

		const distance1 = nearestPointOnLine(polygon, p1, { units: "meters" }).properties.pointDistance;
		const distance2 = nearestPointOnLine(polygon, p2, { units: "meters" }).properties.pointDistance;

		expect(distance1).toBeCloseTo(222390, 0);
		expect(distance2).toEqual(distance1);
	});
});
