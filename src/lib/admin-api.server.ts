import { serverConfig } from "#/lib/config";
export class AdminAPIError extends Error {
	constructor(
		public status: number,
		public code: string,
	) {
		super(code);
	}
}
export async function adminRequest<T>(
	path: string,
	token?: string,
	method = "GET",
	body?: unknown,
): Promise<T> {
	const response = await fetch(`${serverConfig.coreapi.url}${path}`, {
		method,
		redirect: "error",
		cache: "no-store",
		signal: AbortSignal.timeout(15000),
		headers: {
			Origin: new URL(serverConfig.appUrl).origin,
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
	const value = await response.json();
	if (!response.ok)
		throw new AdminAPIError(
			response.status,
			typeof value.error === "string" ? value.error : "AdminUnavailable",
		);
	return value as T;
}
