import { vi } from "vitest";
import type { Response } from "express";

export const createMockResponse = () => {
	const res = {
		status: vi.fn().mockName("res.status"),
		json: vi.fn().mockName("res.json"),
		send: vi.fn().mockName("res.send"),
	};

	for (const mockRes of Object.values(res)) mockRes.mockReturnValue(res);
	return res as unknown as Response & typeof res;
};
