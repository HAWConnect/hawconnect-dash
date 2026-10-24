import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import { requireAccessToken, requireCapability } from "#/lib/auth.server";
import {
	type Announcement,
	type NewAnnouncement,
	newAnnouncementSchema,
} from "#/lib/schemas/announcements";

function convert(row: Announcement): Announcement {
	return {
		...row,
		startDateTime: new Date(row.startDateTime),
		endDateTime: new Date(row.endDateTime),
	};
}
export async function getAnnouncements(token: string) {
	return (await adminRequest<Announcement[]>("/announcements", token)).map(
		convert,
	);
}
async function identity() {
	await requireCapability("announcements");
	return (await requireAccessToken()).accessToken;
}
export const listAnnouncementsFn = createServerFn({ method: "GET" }).handler(
	async () => getAnnouncements(await identity()),
);
export const getAnnouncementFn = createServerFn({ method: "GET" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const rows = await getAnnouncements(await identity());
		const row = rows.find((r) => r.id === data.id);
		if (!row) throw Error("Ankündigung nicht gefunden");
		return row;
	});
export const createAnnouncementFn = createServerFn({ method: "POST" })
	.validator((data: NewAnnouncement) => newAnnouncementSchema.parse(data))
	.handler(async ({ data }) => {
		await adminRequest("/announcements", await identity(), "POST", data);
		return { ok: true as const };
	});
export const updateAnnouncementFn = createServerFn({ method: "POST" })
	.validator((data: NewAnnouncement & { id: string; version?: string }) => ({
		id: data.id,
		version: data.version,
		...newAnnouncementSchema.parse(data),
	}))
	.handler(async ({ data }) => {
		await adminRequest(
			`/announcements/${encodeURIComponent(data.id)}`,
			await identity(),
			"PATCH",
			data,
		);
		return { ok: true as const };
	});
export const deleteAnnouncementFn = createServerFn({ method: "POST" })
	.validator((data: { id: string; version?: string }) => data)
	.handler(async ({ data }) => {
		await adminRequest(
			`/announcements/${encodeURIComponent(data.id)}`,
			await identity(),
			"DELETE",
			{ version: data.version },
		);
		return { ok: true as const };
	});
