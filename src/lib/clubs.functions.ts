import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "./admin-api";
import { requireAccessToken, requireCapability } from "./auth.server";
export interface ClubDirectory {
	available: boolean;
	stale: boolean;
	updatedAt: string | null;
	sourceUrl: string;
	clubs: {
		id: string;
		title: string;
		description: string;
		sourceUrl: string;
		links: { title: string; url: string }[];
	}[];
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
