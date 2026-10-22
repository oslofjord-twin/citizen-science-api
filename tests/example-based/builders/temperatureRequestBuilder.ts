import { vi } from "vitest";
import type { Request, Response } from "express";
import { TemperatureBodyBuilder } from "./temperatureBodyBuilder";
import { users } from "../../seed/model/user";

export const createTemperatureResponse = () => {
	const res = {
		status: vi.fn().mockName("res.status"),
		json: vi.fn().mockName("res.json"),
		send: vi.fn().mockName("res.send"),
	};
	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	res.send.mockReturnValue(res);
	return res as unknown as Response & typeof res;
};

class TemperatureRequestBuilder extends TemperatureBodyBuilder {
	user: { id: unknown } | undefined = { id: users.one.id };

	withNoUser(): this {
		this.user = undefined;
		return this;
	}

	withUserId(userId: unknown): this {
		this.user = { id: userId };
		return this;
	}
}

export const createTemperatureRequest = () => new TemperatureRequestBuilder() as TemperatureRequestBuilder & Request;
