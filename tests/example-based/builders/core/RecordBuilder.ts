export type Rec = Record<string, unknown>;

export class RecordBuilder<Field extends string, T = Rec> {
	body: Rec;

	constructor(defaults: Rec) {
		this.body = { ...defaults };
	}

	with(field: Field, value: unknown): this {
		this.body[field] = value;
		return this;
	}

	without(field: Field): this {
		delete this.body[field];
		return this;
	}

	build(): T {
		return this.body as T;
	}
}
