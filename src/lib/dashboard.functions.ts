import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import {
	type AnnouncementStatus,
	getAnnouncementStatus,
} from "#/lib/announcement-status";
import { getAnnouncements } from "#/lib/announcements.functions";
import { hasCapability } from "#/lib/auth";
import { requireAccessToken } from "#/lib/auth.server";
import type { ServiceStatus } from "#/lib/operations.functions";
export type DashboardSummary = {
	announcements: {
		active: number;
		upcoming: number;
		recent: { id: string; title: string; status: AnnouncementStatus }[];
	} | null;
	events: number | null;
	services: ServiceStatus[] | null;
};
export const getDashboardSummaryFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardSummary> => {
		const { user, accessToken } = await requireAccessToken();
		const rows = hasCapability(user.capabilities, "announcements")
			? await getAnnouncements(accessToken)
			: null;
		const items = rows?.map((r) => ({
			id: r.id,
			title: r.title.de,
			status: getAnnouncementStatus(r),
		}));
		const events = hasCapability(user.capabilities, "events")
			? await adminRequest<unknown[]>("/events", accessToken)
			: null;
		const services = hasCapability(user.capabilities, "ops")
			? await adminRequest<ServiceStatus[]>("/status", accessToken)
			: null;
		return {
			events: events?.length ?? null,
			services,
			announcements: items
				? {
						active: items.filter((r) => r.status === "active").length,
						upcoming: items.filter((r) => r.status === "upcoming").length,
						recent: items.filter((r) => r.status !== "past").slice(0, 5),
					}
				: null,
		};
	},
);
