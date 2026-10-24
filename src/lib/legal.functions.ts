import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "./admin-api";
import { requireAccessToken, requireCapability } from "./auth.server";
export type LegalKey = "privacy" | "imprint";
export interface LegalDraft {
	mode: "internal" | "external";
	body: { de: string; en: string };
	url: { de: string; en: string };
}
export interface LegalDocument {
	key: LegalKey;
	draft: LegalDraft;
	published: LegalDraft | null;
	version: string | null;
	publishedAt: string | null;
}
export const getLegalFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("admin");
		return adminRequest<LegalDocument[]>(
			"/legal",
			(await requireAccessToken()).accessToken,
		);
	},
);
export const writeLegalFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			key: LegalKey;
			action: "save" | "publish" | "withdraw";
			version: string | null;
			draft?: LegalDraft;
		}) => {
			if (
				!["privacy", "imprint"].includes(data.key) ||
				!["save", "publish", "withdraw"].includes(data.action)
			)
				throw Error("InvalidInput");
			return data;
		},
	)
	.handler(async ({ data }) => {
		await requireCapability("admin");
		return adminRequest<LegalDocument>(
			`/legal/${data.key}`,
			(await requireAccessToken()).accessToken,
			"POST",
			data,
		);
	});
