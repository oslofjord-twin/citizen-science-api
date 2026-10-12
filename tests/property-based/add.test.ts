import { describe, it } from "vitest";
import fc from "fast-check";

function add(a: number, b: number): number {
	return a + b;
}

describe("add", () => {
	it("order does not matter in adding", () => {
		fc.assert(
			fc.property(fc.integer(), fc.integer(), (a, b) => {
				return add(b, a) === add(a, b);
			}),
		);
	});

	it("adding zero will return same input", () => {
		fc.assert(
			fc.property(fc.integer(), (a) => {
				return add(a, 0) === a;
			}),
		);
	});

	it("adding one will return input + 1", () => {
		fc.assert(
			fc.property(fc.integer(), (a) => {
				return add(a, 1) === a + 1;
			}),
		);
	});

	it("adding minus one returns input - 1", () => {
		fc.assert(
			fc.property(fc.integer(), (a) => {
				return add(a, -1) === a - 1;
			}),
		);
	});
});
