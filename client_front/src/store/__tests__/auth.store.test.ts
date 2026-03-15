import { describe, expect, it, beforeEach } from "vitest";
import { useAuthStore } from "../auth.store";

describe("useAuthStore", () => {
	beforeEach(() => {
		useAuthStore.setState({ user: null });
	});

	it("starts with null user", () => {
		expect(useAuthStore.getState().user).toBeNull();
	});

	it("setUser stores the user", () => {
		const user = { id: "1", email: "test@test.com", name: "Test" };
		useAuthStore.getState().setUser(user);
		expect(useAuthStore.getState().user).toEqual(user);
	});

	it("clearUser resets to null", () => {
		const user = { id: "1", email: "test@test.com", name: "Test" };
		useAuthStore.getState().setUser(user);
		useAuthStore.getState().clearUser();
		expect(useAuthStore.getState().user).toBeNull();
	});

	it("setUser replaces previous user", () => {
		const user1 = { id: "1", email: "a@test.com", name: "A" };
		const user2 = { id: "2", email: "b@test.com", name: "B" };
		useAuthStore.getState().setUser(user1);
		useAuthStore.getState().setUser(user2);
		expect(useAuthStore.getState().user).toEqual(user2);
	});
});
