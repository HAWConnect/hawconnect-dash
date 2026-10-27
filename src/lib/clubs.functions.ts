import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "./admin-api";
import { requireAccessToken, requireCapability } from "./auth.server";
export interface AdminClub {
	id: string;
	title: string;
	description: string;
	descriptionHtml: string | null;
	sourceUrl: string;
	links: { title: string; url: string }[];
	editorId: string;
	origin: "manual";
	version: string | null;
	contentLanguage: "de" | "en";
}
export interface ClubWrite {
	editorId?: string;
	language: "de" | "en";
	title: string;
	descriptionHtml: string;
	sourceUrl: string;
	links: { title: string; url: string }[];
	version: string | null;
}
export interface ClubDirectory {
	available: boolean;
	stale: boolean;
	updatedAt: string | null;
	sourceUrl: string;
	clubs: AdminClub[];
}
export const getClubsFn = createServerFn({ method: "GET" })
	.validator((data: { language: string }) => ({
		language: data.language === "en" ? "en" : "de",
	}))
	.handler(async ({ data }) => {
		await requireCapability("ops");
		return adminRequest<ClubDirectory>(
			`/clubs?language=${data.language}`,
			(await requireAccessToken()).accessToken,
		);
	});

export const saveClubFn = createServerFn({ method: "POST" })
	.validator((data: ClubWrite) => data)
	.handler(async ({ data }) => {
		await requireCapability("ops");
		return adminRequest<AdminClub>(
			"/clubs",
			(await requireAccessToken()).accessToken,
			"POST",
			data,
		);
	});
export const deleteClubFn = createServerFn({ method: "POST" })
	.validator((data: { editorId: string; version: string }) => data)
	.handler(async ({ data }) => {
		await requireCapability("ops");
		return adminRequest<{ ok: boolean }>(
			`/clubs/${encodeURIComponent(data.editorId)}`,
			(await requireAccessToken()).accessToken,
			"DELETE",
			{ version: data.version },
		);
	});
export const listClubImagesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("ops");
		const { getImageStorage } = await import("./image-storage.server");
		return getImageStorage("clubs").list();
	},
);
export const uploadClubImageFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => {
		if (!(data instanceof FormData)) throw Error("InvalidImage");
		return data;
	})
	.handler(async ({ data }) => {
		await requireCapability("ops");
		const { getImageStorage } = await import("./image-storage.server");
		return getImageStorage("clubs").upload(data.get("image"));
	});
