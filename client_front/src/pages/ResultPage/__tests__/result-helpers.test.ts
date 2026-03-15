import { describe, expect, it } from "vitest";

// Mirror the translateReasoning logic from ResultPage.tsx
function translateReasoning(r: string): string {
	if (r.startsWith("requires_all matched"))
		return r.replace("requires_all matched", "Обов'язкові атрибути");
	if (r.startsWith("requires_optional matched"))
		return r.replace("requires_optional matched", "Додаткові атрибути");
	if (r.startsWith("excludes matched"))
		return r.replace("excludes matched", "Виключені атрибути");
	return r;
}

// Mirror the shouldShowReasoning logic from ResultPage.tsx
function shouldShowReasoning(r: string): boolean {
	return (
		!r.startsWith("requires_optional coverage") &&
		!r.startsWith("fallback") &&
		!r.startsWith("missing_requires_all") &&
		!r.startsWith("hit_excluded")
	);
}

describe("translateReasoning", () => {
	it("translates requires_all matched", () => {
		expect(translateReasoning("requires_all matched: 3/3")).toBe(
			"Обов'язкові атрибути: 3/3",
		);
	});

	it("translates requires_optional matched", () => {
		expect(translateReasoning("requires_optional matched: 2/5")).toBe(
			"Додаткові атрибути: 2/5",
		);
	});

	it("translates excludes matched", () => {
		expect(translateReasoning("excludes matched: 0")).toBe("Виключені атрибути: 0");
	});

	it("returns unknown reasoning as-is", () => {
		expect(translateReasoning("some custom reason")).toBe("some custom reason");
	});

	it("returns empty string as-is", () => {
		expect(translateReasoning("")).toBe("");
	});
});

describe("shouldShowReasoning", () => {
	it("hides requires_optional coverage", () => {
		expect(shouldShowReasoning("requires_optional coverage: 40%")).toBe(false);
	});

	it("hides fallback reasoning", () => {
		expect(shouldShowReasoning("fallback: default offer")).toBe(false);
	});

	it("hides missing_requires_all", () => {
		expect(shouldShowReasoning("missing_requires_all: [1, 2]")).toBe(false);
	});

	it("hides hit_excluded", () => {
		expect(shouldShowReasoning("hit_excluded: [5]")).toBe(false);
	});

	it("shows requires_all matched", () => {
		expect(shouldShowReasoning("requires_all matched: 3/3")).toBe(true);
	});

	it("shows requires_optional matched", () => {
		expect(shouldShowReasoning("requires_optional matched: 2/5")).toBe(true);
	});

	it("shows excludes matched", () => {
		expect(shouldShowReasoning("excludes matched: 0")).toBe(true);
	});

	it("shows unknown reasoning", () => {
		expect(shouldShowReasoning("custom info")).toBe(true);
	});
});
