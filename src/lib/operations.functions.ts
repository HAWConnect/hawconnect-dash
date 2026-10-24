import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import { requireAccessToken, requireCapability } from "#/lib/auth.server";
export type ServiceStatus = {
	name: string;
	available: boolean;
	stale: boolean;
	updatedAt: string | null;
};
export type Permission = {
	email: string;
	capabilities: string[];
	bootstrap: boolean;
};
export const getServiceStatusFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("ops");
		return adminRequest<ServiceStatus[]>(
			"/status",
			(await requireAccessToken()).accessToken,
		);
	},
);
export const getPermissionsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("admin");
		return adminRequest<Permission[]>(
			"/permissions",
			(await requireAccessToken()).accessToken,
		);
	},
);
export const setPermissionsFn = createServerFn({ method: "POST" })
	.validator((data: { email: string; capabilities: string[] }) => data)
	.handler(async ({ data }) => {
		await requireCapability("admin");
		await adminRequest(
			"/permissions",
			(await requireAccessToken()).accessToken,
			"PUT",
			data,
		);
		return { ok: true };
	});
