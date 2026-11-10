import fc, { Arbitrary, Value, Stream, type Random } from "fast-check";
import { CreateTemperatureMeasurementData } from "../../../src/services/temperatureService.ts";
import { osloFjordPoint } from "./OsloFjordPoint.generator.ts";
import { isWithinOslofjord } from "../../../src/utils/geoUtil.ts";
import { ACC, coin, inBound, outBound, Range } from "./core/numbers.ts";
import {
	ALL_FIELDS,
	TEMPERATURE_BOUNDS as BOUNDS,
	NUMBER_FIELDS,
	OPTIONAL_FIELDS,
	REQUIRED_FIELDS,
	TemperatureDataField,
} from "../../shared/temperature.rules.ts";
import { YEAR } from "../../utils/date.ts";

abstract class TemperatureMeasurementDataArbitrary extends Arbitrary<CreateTemperatureMeasurementData> {
	constructor(protected readonly now: number) {
		super();
	}

	// helpers

	private dateRange(): Range {
		return { min: this.now + BOUNDS.measurement_date.min, max: this.now + BOUNDS.measurement_date.max };
	}

	protected validData(mrng: Random, biasFactor: number | undefined): CreateTemperatureMeasurementData {
		const { lat, lon } = osloFjordPoint().generate(mrng, biasFactor).value;

		const data: CreateTemperatureMeasurementData = {
			userId: BOUNDS.userIds[mrng.nextInt(0, BOUNDS.userIds.length - 1)],
			value_celsius: inBound(mrng, biasFactor, BOUNDS.value_celsius),
			depth_meters: inBound(mrng, biasFactor, BOUNDS.depth_meters),
			latitude: lat,
			longitude: lon,
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

	private isValidField(field: TemperatureDataField, val: unknown): boolean {
		switch (field) {
			case "value_celsius":
			case "depth_meters":
				return this.inRange(val, BOUNDS[field]);
			case "latitude":
			case "longitude":
				return typeof val === "number";
			case "measurement_date":
				return (
					typeof val === "string" &&
					this.inRange(new Date(val).getTime(), this.dateRange())
				);
			case "userId":
				return BOUNDS.userIds.includes(val as string);
			case "instrument_type":
				return (BOUNDS.instrument_type as readonly unknown[]).includes(val);
			case "notes":
				return typeof val === "string" && val.length <= BOUNDS.notes.maxLength;
		}
	}

	protected isValid(data: CreateTemperatureMeasurementData): boolean {
		return ALL_FIELDS.every((field) =>
			field in data
				? this.isValidField(field, data[field])
				: !(REQUIRED_FIELDS as readonly string[]).includes(field) &&
					isWithinOslofjord(data.latitude, data.longitude),
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

	private *candidates(
		data: CreateTemperatureMeasurementData,
	): IterableIterator<CreateTemperatureMeasurementData> {
		for (const key of OPTIONAL_FIELDS) {
			if (key in data) {
				const { [key]: _, ...rest } = data;
				yield rest;
			}
		}

		for (const key of NUMBER_FIELDS) {
			const val = data[key] as number;
			if (typeof val !== "number") continue;
			const simplest = 0;
			for (const target of this.towards(val, this.target(BOUNDS[key], val, simplest), ACC)) {
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
		const field = ["missing_required", ...ALL_FIELDS][mrng.nextInt(0, ALL_FIELDS.length)];
		switch (field) {
			case "missing_required":
				delete data[REQUIRED_FIELDS[mrng.nextInt(0, REQUIRED_FIELDS.length - 1)]];
				break;
			case "userId":
				data.userId = fc.string().generate(mrng, biasFactor).value;
				break;
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
						YEAR,
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
