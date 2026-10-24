import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "./admin-api";
import { requireAccessToken, requireCapability } from "./auth.server";
export interface OrganizerProfile {
	id: number;
	name: string;
	description: { de: string; en: string };
	location: string | null;
	website: string | null;
	instagram: string | null;
	linkedin: string | null;
	nonProfit: boolean | null;
	registrationNumber: string | null;
	version: string | null;
}
export type OrganizerInput = Omit<OrganizerProfile, "id">;
export const getOrganizersFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("events");
		return adminRequest<OrganizerProfile[]>(
			"/organizers",
			(await requireAccessToken()).accessToken,
		);
	},
);
export const saveOrganizerFn = createServerFn({ method: "POST" })
	.validator((data: OrganizerInput) => data)
	.handler(async ({ data }) => {
		await requireCapability("events");
		return adminRequest<OrganizerProfile>(
			"/organizers",
			(await requireAccessToken()).accessToken,
			"POST",
			data,
		);
	});
