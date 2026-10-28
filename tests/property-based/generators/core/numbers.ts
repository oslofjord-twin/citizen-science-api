import { Random } from "fast-check";

export const ACC = 1e-9;

export type Range = { min: number; max: number };
export type Bias = number | undefined;

// random generator
export const coin = (mrng: Random): boolean => mrng.nextInt(0, 1) === 1;

export const pick = <T>(mrng: Random, values: readonly T[]): T => values[mrng.nextInt(0, values.length - 1)];

export const biased = (mrng: Random, bias: Bias): boolean => bias !== undefined && mrng.nextInt(1, bias) === 1;

// number generators
export const nextDouble = (mrng: Random, { min, max }: Range): number =>
	min + (max - min) * ((mrng.nextInt(0, 2 ** 26 - 1) + mrng.nextInt(0, 2 ** 27 - 1) / 2 ** 27) / 2 ** 26);

export const inBound = (mrng: Random, bias: Bias, { min, max }: Range): number =>
	biased(mrng, bias) ? (coin(mrng) ? min : max) : nextDouble(mrng, { min, max });

export const outBound = (mrng: Random, bias: Bias, { min, max }: Range, spread = Number.MAX_VALUE): number => {
	const below = coin(mrng);
	if (biased(mrng, bias)) return below ? min - ACC : max + ACC;
	return below
		? nextDouble(mrng, { min: min - spread, max: min - ACC })
		: nextDouble(mrng, { min: max + ACC, max: max + spread });
};

// shrinking
export const shrinkTarget = ({ min, max }: Range, x: number, simplest: number, step = ACC): number =>
	x < min ? min - step : x > max ? max + step : simplest;

export function* towards(current: number, target: number, step: number): IterableIterator<number> {
	let t = target;
	while (Math.abs(current - t) > step) {
		yield t;
		const next = t + (current - t) / 2;
		if (Math.abs(current - next) <= step || next === t) {
			const last = current - Math.sign(current - t) * step;
			if (last !== current) yield last;
			return;
		}
		t = next;
	}
}
