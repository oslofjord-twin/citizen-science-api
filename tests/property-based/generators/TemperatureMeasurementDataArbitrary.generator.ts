import fc, { Arbitrary, Value, Stream, type Random } from "fast-check";
import { users } from "../../seed/model/user";
import { CreateTemperatureMeasurementData } from "services/temperatureService";

const BOUNDS = {
	userId: [users.one.id, users.two.id],
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
const REQUIRED = [...NUM_FIELDS, "measurement_date", "userId"] as const;
const OPTIONAL = ["instrument_type", "notes"] as const;
const fields = [...REQUIRED, ...OPTIONAL] as const;
type Field = (typeof fields)[number];
type Range = { min: number; max: number };

const acc = 0.000000001;

export const coin = (mrng: Random) => mrng.nextInt(0, 1);

export const nextDouble = (mrng: Random, { min, max }: Range) =>
	min + (max - min) * ((mrng.nextInt(0, 2 ** 26 - 1) + mrng.nextInt(0, 2 ** 27 - 1) / 2 ** 27) / 2 ** 26);

export const biased = (mrng: Random, biasFactor: number | undefined) =>
	biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1;

export const inBound = (mrng: Random, biasFactor: number | undefined, { min, max }: Range) =>
	biased(mrng, biasFactor) ? (coin(mrng) ? min : max) : nextDouble(mrng, { min, max });

export const outBound = (
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

abstract class TemperatureMeasurementDataArbitrary extends Arbitrary<CreateTemperatureMeasurementData> {
	constructor(protected readonly now: number) {
		super();
	}

	// helpers

	private dateRange(): Range {
		return { min: this.now + BOUNDS.measurement_date.min, max: this.now + BOUNDS.measurement_date.max };
	}

	protected validData(mrng: Random, biasFactor: number | undefined): CreateTemperatureMeasurementData {
		const data: CreateTemperatureMeasurementData = {
			userId: BOUNDS.userId[mrng.nextInt(0, BOUNDS.userId.length - 1)],
			value_celsius: inBound(mrng, biasFactor, BOUNDS.value_celsius),
			depth_meters: inBound(mrng, biasFactor, BOUNDS.depth_meters),
			latitude: inBound(mrng, biasFactor, BOUNDS.latitude),
			longitude: inBound(mrng, biasFactor, BOUNDS.longitude),
			measurement_date: new Date(
				this.now + inBound(mrng, biasFactor, BOUNDS.measurement_date),
			).toISOString(),
		};

		if (coin(mrng)) {
			data.instrument_type =
				BOUNDS.instrument_type[mrng.nextInt(0, BOUNDS.instrument_type.length - 1)];
		}
		if (coin(mrng)) {
			data.notes = fc.string(BOUNDS.notes).generate(mrng, biasFactor).value;
		}

		return data;
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
			case "userId":
				return BOUNDS.userId.includes(val as string);
			case "instrument_type":
				return BOUNDS.instrument_type.includes(val as string | undefined);
			case "notes":
				return typeof val === "string" && val.length <= BOUNDS.notes.maxLength;
		}
	}

	protected isValid(data: CreateTemperatureMeasurementData): boolean {
		return fields.every((field) =>
			field in data
				? this.isValidField(field, data[field])
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

	private *candidates(
		data: CreateTemperatureMeasurementData,
	): IterableIterator<CreateTemperatureMeasurementData> {
		for (const key of OPTIONAL) {
			if (key in data) {
				const { [key]: _, ...rest } = data;
				yield rest;
			}
		}

		for (const key of NUM_FIELDS) {
			const val = data[key] as number;
			if (typeof val !== "number") continue;
			const simplest = 0;
			for (const target of this.towards(val, this.target(BOUNDS[key], val, simplest), acc)) {
				yield { ...data, [key]: target };
			}
		}

		if (data.measurement_date) {
			const time = new Date(data.measurement_date).getTime();
			for (const target of this.towards(time, this.target(this.dateRange(), time, this.now, 1), 1)) {
				yield { ...data, ["measurement_date"]: new Date(Math.round(target)).toISOString() };
			}
		}

		// TODO generate notes and instrument
	}

	shrink(value: CreateTemperatureMeasurementData): Stream<Value<CreateTemperatureMeasurementData>> {
		return new Stream(this.candidates(value))
			.filter((data) => this.canShrinkWithoutContext(data))
			.map((data) => new Value(data, undefined));
	}
}

class ValidTemperatureMeasurementDataArbitrary extends TemperatureMeasurementDataArbitrary {
	generate(mrng: Random, biasFactor: number | undefined): Value<CreateTemperatureMeasurementData> {
		const data: CreateTemperatureMeasurementData = this.validData(mrng, biasFactor);
		return new Value(data, undefined);
	}

	canShrinkWithoutContext(value: unknown): value is CreateTemperatureMeasurementData {
		return this.isValid(value as CreateTemperatureMeasurementData); // should return only valid bodies
	}
}

// Invalid
class InvalidTemperatureMeasurementDataArbitrary extends TemperatureMeasurementDataArbitrary {
	constructor(now: number) {
		super(now);
	}

	generate(mrng: Random, biasFactor: number | undefined): Value<CreateTemperatureMeasurementData> {
		const data = this.validData(mrng, biasFactor);
		const field = ["missing_required", ...fields][mrng.nextInt(0, fields.length)];
		switch (field) {
			case "missing_required":
				delete data[REQUIRED[mrng.nextInt(0, REQUIRED.length - 1)]];
				break;
			case "userId":
				data.userId = fc.string().generate(mrng, biasFactor).value;
			case "value_celsius":
				data.value_celsius = outBound(mrng, biasFactor, BOUNDS.value_celsius);
				break;
			case "depth_meters":
				data.depth_meters = outBound(mrng, biasFactor, BOUNDS.depth_meters);
				break;
			case "latitude":
				data.latitude = outBound(mrng, biasFactor, BOUNDS.latitude);
				break;
			case "longitude":
				data.longitude = outBound(mrng, biasFactor, BOUNDS.longitude);
				break;
			case "measurement_date":
				data.measurement_date = new Date(
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
				data.instrument_type =
					"42" + fc.string({ minLength: 1 }).generate(mrng, biasFactor).value; // rewrite logic maybe
				break;
			case "notes":
				data.notes = fc.string({ minLength: 501 }).generate(mrng, biasFactor).value;
				break;
		}
		return new Value(data, undefined);
	}

	canShrinkWithoutContext(value: unknown): value is CreateTemperatureMeasurementData {
		return !this.isValid(value as CreateTemperatureMeasurementData);
	}
}

export const validTemperatureData = (now: number) => new ValidTemperatureMeasurementDataArbitrary(now);
export const invalidTemperatureData = (now: number) => new InvalidTemperatureMeasurementDataArbitrary(now);
