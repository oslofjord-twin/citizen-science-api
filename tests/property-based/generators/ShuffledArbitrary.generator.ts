import { Arbitrary, Random, Stream, Value } from "fast-check";
import { nextDouble } from "./core/numbers";

const shuffle = <T>(mrng: Random, items: readonly T[]): T[] =>
	[...items].sort(() => nextDouble(mrng, { min: 0, max: 0 }) - 0.5);

class ShuffledArbitrary<T> extends Arbitrary<T[]> {
	constructor(private readonly inner: Arbitrary<T[]>) {
		super();
	}

	generate(mrng: Random, biasFactor: number | undefined): Value<T[]> {
		const items = this.inner.generate(mrng, biasFactor).value;
		return new Value(shuffle(mrng, items), undefined);
	}

	canShrinkWithoutContext(_value: unknown): _value is T[] {
		return false;
	}

	shrink(_value: T[], _context: unknown): Stream<Value<T[]>> {
		return Stream.nil();
	}
}

export const shuffled = <T>(inner: Arbitrary<T[]>): Arbitrary<T[]> => new ShuffledArbitrary(inner);
