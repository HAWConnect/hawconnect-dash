import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import { requireAccessToken, requireCapability } from "#/lib/auth.server";
export interface ClubEvent {
	id: string;
	title: { de: string; en: string };
	description: { de: string; en: string };
	startDateTime: string;
	endDateTime: string | null;
	organizer: string;
	location: string | null;
	url: string | null;
	version?: string;
}
async function token() {
	await requireCapability("events");
	return (await requireAccessToken()).accessToken;
}
export const listEventsFn = createServerFn({ method: "GET" }).handler(
	async () => adminRequest<ClubEvent[]>("/events", await token()),
);
export const saveEventFn = createServerFn({ method: "POST" })
	.validator((data: Partial<ClubEvent>) => data)
	.handler(async ({ data }) => {
		await adminRequest(
			data.id ? `/events/${encodeURIComponent(data.id)}` : "/events",
			await token(),
			data.id ? "PATCH" : "POST",
			data,
		);
		return { ok: true };
	});
export const deleteEventFn = createServerFn({ method: "POST" })
	.validator((data: { id: string; version?: string }) => data)
	.handler(async ({ data }) => {
		await adminRequest(
			`/events/${encodeURIComponent(data.id)}`,
			await token(),
			"DELETE",
			{ version: data.version },
		);
		return { ok: true };
	});
