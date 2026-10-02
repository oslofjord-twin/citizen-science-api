import { describe, it, expect } from "vitest";

function add(a: number, b: number): number {
	return a + b;
}

describe("add", () => {
	it("adds two positive numbers correctly", () => {
		expect(add(1, 1)).toBe(2);
	});

	it("adds two negative numbers correctly", () => {
		expect(add(-1, -1)).toBe(-2);
	});

	it("adds both positive and negative numbers correctly", () => {
		expect(add(-1, 1)).toBe(0);
	});
});
