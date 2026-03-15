import { describe, expect, it } from "vitest";
import { ROUTES } from "../routes";

describe("ROUTES", () => {
	it("contains all expected route keys", () => {
		expect(ROUTES).toHaveProperty("MAIN");
		expect(ROUTES).toHaveProperty("LOGIN");
		expect(ROUTES).toHaveProperty("QUIZ");
		expect(ROUTES).toHaveProperty("RESULT");
	});

	it("all routes start with /", () => {
		for (const route of Object.values(ROUTES)) {
			expect(route).toMatch(/^\//);
		}
	});

	it("has correct route values", () => {
		expect(ROUTES.MAIN).toBe("/");
		expect(ROUTES.LOGIN).toBe("/login");
		expect(ROUTES.QUIZ).toBe("/quiz");
		expect(ROUTES.RESULT).toBe("/result");
	});
});
