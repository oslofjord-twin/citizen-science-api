import earcut, { flatten, deviation } from "earcut";
import fc, { Arbitrary, Random, Stream, Value } from "fast-check";
import { normalizedCoords } from "../../../src/utils/geoUtil.ts";
import { ACC, nextDouble } from "./core/numbers.ts";

export type Point = { lat: number; lon: number };
type Corner = [number, number];
type Triangle = [Corner, Corner, Corner];
const triplets: Triangle[] = [];

for (const polygon of normalizedCoords) {
	const { vertices, holes, dimensions } = flatten(polygon);
	const flattenedTriplets = earcut(vertices, holes, dimensions);

	const err = deviation(vertices, holes, dimensions, flattenedTriplets);
	if (err >= ACC) {
		throw new Error(`Triplets were generated not accuratly enough, deviation from real data: ${err}`);
	}

	const getCorner = (i: number): Corner => [vertices[i * dimensions], vertices[i * dimensions + 1]];

	for (let i = 0; i < flattenedTriplets.length - 1; i += 3) {
		triplets.push([0, 1, 2].map((l) => getCorner(flattenedTriplets[i + l])) as Triangle);
	}
}

type Context = { triplet: number; u: number; v: number };
const toNewPoint = ({ triplet, u, v }: Context): Point => {
	const [a, b, c] = triplets[triplet];
	return {
		lon: a[0] + u * (b[0] - a[0]) + v * (c[0] - a[0]),
		lat: a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1]),
	};
};

class OsloFjordPoint extends Arbitrary<Point> {
	generate(mrng: Random, biasFactor: number | undefined): Value<Point> {
		const triplet = mrng.nextInt(0, triplets.length - 1);

		let u = nextDouble(mrng, { min: 0, max: 1 });
		let v = nextDouble(mrng, { min: 0, max: 1 });

		if (u + v > 1) {
			u = 1 - u;
			v = 1 - v;
		}

		if (biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1) {
			u *= ACC;
			v *= ACC;
		}

		const context: Context = { triplet, u, v };
		return new Value(toNewPoint(context), context);
	}

	canShrinkWithoutContext(value: unknown): value is Point {
		return false;
	}

	shrink(_value: Point, context: Context | undefined): Stream<fc.Value<Point>> {
		if (!context || context.u + context.v < ACC) return Stream.nil();

		const candidates: Context[] = [
			{ ...context, u: context.u * ACC, v: context.v * ACC },
			{ ...context, u: context.u / 2, v: context.v / 2 },
		];

		return Stream.of(...candidates.map((c) => new Value(toNewPoint(c), c)));
	}
}

export const osloFjordPoint = (): Arbitrary<Point> => new OsloFjordPoint();
