import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import { requireAccessToken, requireCapability } from "#/lib/auth.server";
import type { AuditLogEntry } from "#/lib/schemas/audit-log";
export const listAuditLogFn = createServerFn({ method: "GET" })
	.validator((data?: { limit?: number; cursor?: string }) => ({
		limit: data?.limit ?? 100,
		offset: Number(data?.cursor ?? 0),
	}))
	.handler(async ({ data }): Promise<AuditLogEntry[]> => {
		await requireCapability("audit");
		const { accessToken } = await requireAccessToken();
		return adminRequest(
			`/audit?limit=${data.limit}&offset=${data.offset}`,
			accessToken,
		);
	});
