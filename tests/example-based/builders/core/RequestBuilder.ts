import { Rec, RecordBuilder } from "./RecordBuilder";

export class RequestBuilder<Field extends string> extends RecordBuilder<Field> {
	user: { id: unknown } | undefined;

	constructor(defaults: Rec, userId: unknown) {
		super(defaults);
		this.user = { id: userId };
	}

	withUserId(userId: unknown): this {
		this.user = { id: userId };
		return this;
	}

	withNoUser(): this {
		this.user = undefined;
		return this;
	}
}
