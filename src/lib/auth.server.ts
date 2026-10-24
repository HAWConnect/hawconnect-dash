import { redirect } from "@tanstack/react-router";
import { setResponseStatus } from "@tanstack/react-start/server";
import { AdminAPIError, adminRequest } from "#/lib/admin-api.server";
import type { AppCapability, SessionUser } from "#/lib/auth";
import {
	canAccessAnnouncements,
	canAccessAudit,
	canAccessOps,
	canAccessReports,
	hasAppAccess,
	hasCapability,
} from "#/lib/auth";
import { getAppSession } from "#/lib/session";
export const isAuthConfigured = () => true;
export async function getAccessToken() {
	return (await getAppSession()).data.accessToken ?? null;
}
export async function getSessionUser(): Promise<SessionUser | null> {
	const s = await getAppSession();
	if (!s.data.accessToken) return null;
	try {
		const v = await adminRequest<{
			user: {
				id: string;
				email: string;
				name: string;
				capabilities: AppCapability[];
			};
		}>("/auth/session", s.data.accessToken);
		return { ...v.user, sub: v.user.id, groups: [] };
	} catch (e) {
		if (e instanceof AdminAPIError && [401, 403].includes(e.status))
			await s.clear();
		return null;
	}
}
export async function requireAppAccess(options?: { asJson?: boolean }) {
	const user = await getSessionUser();
	if (!user) {
		if (options?.asJson) {
			setResponseStatus(401);
			throw Error("Anmeldung erforderlich");
		}
		throw redirect({ to: "/login" });
	}
	if (!hasAppAccess(user.capabilities)) {
		setResponseStatus(403);
		throw Error("Kein Zugang");
	}
	return user;
}
export async function requireCapability(
	capability: AppCapability,
	options?: { asJson?: boolean },
) {
	const user = await requireAppAccess(options);
	if (
		capability === "admin"
			? !user.capabilities.includes("admin")
			: !hasCapability(user.capabilities, capability)
	) {
		setResponseStatus(403);
		throw Error("Kein Zugang");
	}
	return user;
}
export async function requireAccessToken(options?: { asJson?: boolean }) {
	const user = await requireAppAccess(options);
	const accessToken = await getAccessToken();
	if (!accessToken) throw Error("Anmeldung erforderlich");
	return { user, accessToken };
}
export async function buildLogoutRedirectUrl() {
	const s = await getAppSession();
	try {
		if (s.data.accessToken)
			await adminRequest("/auth/logout", s.data.accessToken, "POST", {});
	} finally {
		await s.clear();
	}
	return "/login";
}
export {
	canAccessAnnouncements,
	canAccessAudit,
	canAccessOps,
	canAccessReports,
	hasAppAccess,
};
