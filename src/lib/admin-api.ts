import { createServerOnlyFn } from "@tanstack/react-start";
export const adminRequest = createServerOnlyFn(
	async <T>(
		path: string,
		token?: string,
		method = "GET",
		body?: unknown,
	): Promise<T> => {
		const server = await import("#/lib/admin-api.server");
		return server.adminRequest<T>(path, token, method, body);
	},
);
