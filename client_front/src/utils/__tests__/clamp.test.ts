import { describe, expect, it } from "vitest";
import { clamp } from "../index";

describe("clamp", () => {
	it("returns the value when within range", () => {
		expect(clamp(50, 0, 100)).toBe(50);
	});

	it("clamps to min when value is below", () => {
		expect(clamp(-10, 0, 100)).toBe(0);
	});

	it("clamps to max when value is above", () => {
		expect(clamp(200, 0, 100)).toBe(100);
	});

	it("returns min when value equals min", () => {
		expect(clamp(0, 0, 100)).toBe(0);
	});

	it("returns max when value equals max", () => {
		expect(clamp(100, 0, 100)).toBe(100);
	});

	it("works with negative ranges", () => {
		expect(clamp(-5, -10, -1)).toBe(-5);
		expect(clamp(-20, -10, -1)).toBe(-10);
		expect(clamp(5, -10, -1)).toBe(-1);
	});

	it("works when min equals max", () => {
		expect(clamp(50, 10, 10)).toBe(10);
	});
});
