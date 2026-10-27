import type { AdminClub, ClubWrite } from "./clubs.functions";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "./image-policy";
export function safeClubUrl(value: string, image = false): boolean {
	try {
		const url = new URL(value);
		return (
			!url.username &&
			!url.password &&
			(url.protocol === "https:" || (!image && url.protocol === "mailto:"))
		);
	} catch {
		return false;
	}
}
export function plainToHtml(value: string): string {
	return `<p>${value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\r?\n/g, "<br>")}</p>`;
}

export function isClubImageFile(file: File): boolean {
	return (
		file.size > 0 &&
		file.size <= MAX_IMAGE_BYTES &&
		IMAGE_TYPES.includes(file.type)
	);
}

export function clubWriteDraft(
	language: "de" | "en",
	club?: AdminClub,
): ClubWrite {
	return {
		editorId: club?.editorId,
		version: club?.version ?? null,
		language,
		title: club?.title ?? "",
		descriptionHtml:
			club?.descriptionHtml ?? plainToHtml(club?.description ?? ""),
		sourceUrl: club?.sourceUrl ?? "",
		links: club?.links ?? [],
	};
}
