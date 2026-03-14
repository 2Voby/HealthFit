import axios from "axios";

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string; details: any };

export const client = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
	return config;
});

client.interceptors.response.use(
	(res) => res,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
		}
		return Promise.reject(error);
	},
);
