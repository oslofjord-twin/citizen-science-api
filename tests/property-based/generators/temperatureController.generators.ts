import fc, { Arbitrary, Value, Stream, type Random } from "fast-check";

type Body = Record<string, unknown>;

const BOUNDS = {
	value_celsius: { min: -50, max: 100, noNaN: true },
	depth_meters: { min: 0, max: 200, noNaN: true },
	latitude: { min: -90, max: 90, noNaN: true },
	longitude: { min: -180, max: 180, noNaN: true },
	// can change later
	measurement_date: {
		min: -2 * 365.25 * 24 * 60 * 60 * 1000,
		max: 10 * 60 * 1000,
	},
	notes: { maxLength: 500, size: "max" as const },
	instrument_type: ["thermometer", undefined, ""],
};

const NUM_FIELDS = ["value_celsius", "depth_meters", "latitude", "longitude"] as const;
const REQUIRED = [...NUM_FIELDS, "measurement_date"] as const;
const OPTIONAL = ["instrument_type", "notes"] as const;
const fields = [...REQUIRED, ...OPTIONAL] as const;
type Field = (typeof fields)[number];

const acc = 0.000000001;

type Range = { min: number; max: number };

const coin = (mrng: Random) => mrng.nextInt(0, 1);

const nextDouble = (mrng: Random, { min, max }: Range) =>
	min + (max - min) * ((mrng.nextInt(0, 2 ** 26 - 1) + mrng.nextInt(0, 2 ** 27 - 1) / 2 ** 27) / 2 ** 26);

const biased = (mrng: Random, biasFactor: number | undefined) =>
	biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1;

const inBound = (mrng: Random, biasFactor: number | undefined, { min, max }: Range) =>
	biased(mrng, biasFactor) ? (coin(mrng) ? min : max) : nextDouble(mrng, { min, max });

const outBound = (
	mrng: Random,
	biasFactor: number | undefined,
	{ min, max }: Range,
	spread: number = Number.MAX_VALUE,
) =>
	biased(mrng, biasFactor)
		? coin(mrng)
			? min - acc
			: max + acc
		: coin(mrng)
			? nextDouble(mrng, { min: min - spread, max: min - acc })
			: nextDouble(mrng, { min: max + acc, max: max + spread });

const requestUser = () =>
	fc.record({
		id: fc.uuid(),
	});

abstract class TemperatureBodyArbitrary extends Arbitrary<Body> {
	constructor(protected readonly now: number) {
		super();
	}

	// helpers

	private dateRange(): Range {
		return { min: this.now + BOUNDS.measurement_date.min, max: this.now + BOUNDS.measurement_date.max };
	}

	protected validBody(mrng: Random, biasFactor: number | undefined): Body {
		const body: Body = {
			value_celsius: inBound(mrng, biasFactor, BOUNDS.value_celsius),
			depth_meters: inBound(mrng, biasFactor, BOUNDS.depth_meters),
			latitude: inBound(mrng, biasFactor, BOUNDS.latitude),
			longitude: inBound(mrng, biasFactor, BOUNDS.longitude),
			measurement_date: new Date(this.now + inBound(mrng, biasFactor, BOUNDS.measurement_date)),
		};
		if (coin(mrng)) {
			body.instrument_type =
				BOUNDS.instrument_type[mrng.nextInt(0, BOUNDS.instrument_type.length - 1)];
		}
		if (coin(mrng)) {
			body.notes = fc.string(BOUNDS.notes).generate(mrng, biasFactor).value;
		}

		return body;
	}

	// oracle

	private inRange(val: unknown, { min, max }: Range): boolean {
		return typeof val === "number" && min <= val && val <= max;
	}

	private isValidField(field: Field, val: unknown): boolean {
		switch (field) {
			case "value_celsius":
			case "depth_meters":
			case "latitude":
			case "longitude":
				return this.inRange(val, BOUNDS[field]);
			case "measurement_date":
				return val instanceof Date && this.inRange(val.getTime(), this.dateRange());
			case "instrument_type":
				return BOUNDS.instrument_type.includes(val as string | undefined);
			case "notes":
				return typeof val === "string" && val.length <= BOUNDS.notes.maxLength;
		}
	}

	protected isValid(body: Body): boolean {
		return fields.every((field) =>
			field in body
				? this.isValidField(field, body[field])
				: !(REQUIRED as readonly string[]).includes(field),
		);
	}

	// shrinking

	private target({ min, max }: Range, x: number, simplest: number, step: number = acc): number {
		if (x < min) return min - step;
		if (x > max) return max + step;
		return simplest;
	}

	private *towards(current: number, target: number, step: number): IterableIterator<number> {
		if (Math.abs(current - target) <= step) return;
		yield target;

		const toward = target + (current - target) / 2;
		if (Math.abs(current - toward) > step && toward !== target) {
			yield* this.towards(current, toward, step);
		} else {
			const last = current - Math.sign(current - target) * step;
			if (last !== current) yield last;
		}
	}

	private *candidates(body: Body): IterableIterator<Body> {
		for (const key of OPTIONAL) {
			if (key in body) {
				const { [key]: _, ...rest } = body;
				yield rest;
			}
		}

		for (const key of NUM_FIELDS) {
			const val = body[key] as number;
			const simplest = 0;
			for (const target of this.towards(val, this.target(BOUNDS[key], val, simplest), acc)) {
				yield { ...body, [key]: target };
			}
		}

		const time = (body.measurement_date as Date).getTime();
		for (const target of this.towards(time, this.target(this.dateRange(), time, this.now, 1), 1)) {
			yield { ...body, ["measurement_date"]: new Date(Math.round(target)) };
		}

		// generate notes and instrument
	}

	shrink(value: Body): Stream<Value<Body>> {
		return new Stream(this.candidates(value))
			.filter((body) => this.canShrinkWithoutContext(body))
			.map((body) => new Value(body, undefined));
	}
}

class ValidTemperatureBodyArbitrary extends TemperatureBodyArbitrary {
	generate(mrng: Random, biasFactor: number | undefined): Value<Body> {
		const body: Body = this.validBody(mrng, biasFactor);
		return new Value(body, undefined);
	}

	canShrinkWithoutContext(value: unknown): value is Body {
		return this.isValid(value as Body); // should return only valid bodies
	}
}

// Invalid
class InvalidTemperatureBodyArbitrary extends TemperatureBodyArbitrary {
	constructor(now: number) {
		super(now);
	}

	generate(mrng: Random, biasFactor: number | undefined): Value<Body> {
		const body = this.validBody(mrng, biasFactor);
		const field = fields[mrng.nextInt(0, fields.length - 1)];
		switch (field) {
			case "value_celsius":
				body.value_celsius = outBound(mrng, biasFactor, BOUNDS.value_celsius);
				break;
			case "depth_meters":
				body.depth_meters = outBound(mrng, biasFactor, BOUNDS.depth_meters);
				break;
			case "latitude":
				body.latitude = outBound(mrng, biasFactor, BOUNDS.latitude);
				break;
			case "longitude":
				body.longitude = outBound(mrng, biasFactor, BOUNDS.longitude);
				break;
			case "measurement_date":
				body.measurement_date = new Date(
					outBound(
						mrng,
						biasFactor,
						{
							min: this.now + BOUNDS.measurement_date.min - 1,
							max: this.now + BOUNDS.measurement_date.max + 1,
						},
						365 * 24 * 60 * 60 * 1000,
					),
				);
				break;
			case "instrument_type":
				body.instrument_type =
					"42" + fc.string({ minLength: 1 }).generate(mrng, biasFactor).value; // rewrite logic
				break;
			case "notes":
				body.notes = fc.string({ minLength: 501 }).generate(mrng, biasFactor).value;
				break;
		}
		return new Value(body, undefined);
	}

	canShrinkWithoutContext(value: unknown): value is Body {
		return !this.isValid(value as Body);
	}
}

export const validRequestBody = (now: number) => new ValidTemperatureBodyArbitrary(now);
export const invalidRequestBody = (now: number) => new InvalidTemperatureBodyArbitrary(now);

export const validUser = () => fc.record({ id: fc.uuid({ version: 4 }) });
export const invalidUser = () =>
	fc.oneof(
		fc.constant(undefined),
		fc.constant({}),
		fc.record({ id: fc.oneof(fc.constantFrom(null, undefined, 42, ""), fc.string()) }),
	);

export const request = (body: Arbitrary<Body>, user: Arbitrary<Body | undefined>) =>
	fc.record({
		body: body,
		user: user,
	});
