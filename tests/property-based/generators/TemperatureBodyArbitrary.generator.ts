import fc, { Arbitrary, Value, Stream, type Random } from "fast-check";
import { ACC, coin, inBound, outBound, Range } from "./core/numbers";
import {
	ALL_FIELDS,
	REQUIRED_FIELDS,
	TEMPERATURE_BOUNDS as BOUNDS,
	TemperatureField,
	OPTIONAL_FIELDS,
	NUMBER_FIELDS,
	TemperatureBody as Body,
} from "../../shared/temperature.rules";

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
			measurement_date: new Date(
				this.now + inBound(mrng, biasFactor, BOUNDS.measurement_date),
			).toISOString(),
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

	private isValidField(field: TemperatureField, val: unknown): boolean {
		switch (field) {
			case "value_celsius":
			case "depth_meters":
			case "latitude":
			case "longitude":
				return this.inRange(val, BOUNDS[field]);
			case "measurement_date":
				return val instanceof Date && this.inRange(val.getTime(), this.dateRange());
			case "instrument_type":
				return (BOUNDS.instrument_type as readonly unknown[]).includes(val);
			case "notes":
				return typeof val === "string" && val.length <= BOUNDS.notes.maxLength;
		}
	}

	protected isValid(body: Body): boolean {
		return ALL_FIELDS.every((field) =>
			field in body
				? this.isValidField(field, body[field])
				: !(REQUIRED_FIELDS as readonly string[]).includes(field),
		);
	}

	// shrinking

	private target({ min, max }: Range, x: number, simplest: number, step: number = ACC): number {
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
		for (const key of OPTIONAL_FIELDS) {
			if (key in body) {
				const { [key]: _, ...rest } = body;
				yield rest;
			}
		}

		for (const key of NUMBER_FIELDS) {
			const val = body[key] as number;
			if (typeof val !== "number") continue;
			const simplest = 0;
			for (const target of this.towards(val, this.target(BOUNDS[key], val, simplest), ACC)) {
				yield { ...body, [key]: target };
			}
		}

		if (typeof body.measurement_date === "string") {
			const time = new Date(body.measurement_date).getTime();
			for (const target of this.towards(time, this.target(this.dateRange(), time, this.now, 1), 1)) {
				yield { ...body, ["measurement_date"]: new Date(Math.round(target)).toISOString() };
			}
		}

		// TODO generate notes and instrument
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
		const field = ["missing_required", ...ALL_FIELDS][mrng.nextInt(0, ALL_FIELDS.length)];
		switch (field) {
			case "missing_required":
				delete body[REQUIRED_FIELDS[mrng.nextInt(0, REQUIRED_FIELDS.length - 1)]];
				break;
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
				).toISOString();
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

export const validUser = () => fc.record({ id: fc.constantFrom(...BOUNDS.userIds) }, { noNullPrototype: true });
export const invalidUser = () =>
	fc.oneof(
		fc.constantFrom(undefined, null),
		fc.constant({}),
		fc.record(
			{ id: fc.oneof(fc.constantFrom(null, undefined, 42, ""), fc.string()) },
			{ noNullPrototype: true },
		),
	);

export const request = (body: Arbitrary<Body>, user: Arbitrary<Record<string, unknown> | undefined | null>) =>
	fc.record(
		{
			body: body,
			user: user,
		},
		{ noNullPrototype: true },
	);
