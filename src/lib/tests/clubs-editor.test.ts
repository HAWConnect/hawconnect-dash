import { expect, test } from "bun:test";
import {
	clubWriteDraft,
	isClubImageFile,
	plainToHtml,
	safeClubUrl,
} from "../clubs-editor";
import { createImageStorage, scopeImageConfig } from "../image-storage.server";

test("editor only accepts credential-free HTTPS and mailto links", () => {
	expect(safeClubUrl("https://example.org")).toBe(true);
	expect(safeClubUrl("mailto:club@example.org")).toBe(true);
	for (const url of [
		"javascript:alert(1)",
		"http://example.org",
		"https://user:pass@example.org",
		"data:text/html,x",
	])
		expect(safeClubUrl(url)).toBe(false);
});
test("plain descriptions become escaped paragraphs", () => {
	expect(plainToHtml("<script>x</script>\nNext")).toBe(
		"<p>&lt;script&gt;x&lt;/script&gt;<br>Next</p>",
	);
});
test("club images use a subprefix and announcement gallery excludes them", async () => {
	const config = {
		accountId: "a".repeat(32),
		bucket: "assets",
		accessKeyId: "fixture",
		secretAccessKey: "fixture",
		publicUrl: "https://assets.example.org",
		prefix: "dash-images/",
	};
	expect(scopeImageConfig(config, "clubs").prefix).toBe("dash-images/clubs/");
	expect(scopeImageConfig(config).prefix).toBe("dash-images/");
	const transport = {
		put: async () => {},
		list: async () => ({
			objects: [
				{ key: "dash-images/old.png" },
				{ key: "dash-images/legacy/photo.png" },
				{ key: "dash-images/clubs/new.png" },
			],
		}),
	};
	expect(
		(await createImageStorage(config, transport).list()).map((x) => x.name),
	).toEqual(["old.png", "legacy/photo.png"]);
	expect(
		(
			await createImageStorage(
				scopeImageConfig(config, "clubs"),
				transport,
			).list()
		).map((x) => x.name),
	).toEqual(["new.png"]);
});

test("image URL insertion accepts HTTPS only and rejects credentials", () => {
	expect(safeClubUrl("https://assets.example.org/club.png", true)).toBe(true);
	for (const value of [
		"http://assets.example.org/club.png",
		"mailto:club@example.org",
		"data:image/png;base64,x",
		"javascript:alert(1)",
		"https://user:pass@assets.example.org/club.png",
	])
		expect(safeClubUrl(value, true)).toBe(false);
});
test("editor file validation rejects empty, oversized and unsupported files", () => {
	for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"])
		expect(isClubImageFile(new File(["x"], "fixture", { type }))).toBe(true);
	expect(isClubImageFile(new File([], "fixture", { type: "image/png" }))).toBe(
		false,
	);
	expect(
		isClubImageFile(new File(["x"], "fixture", { type: "image/svg+xml" })),
	).toBe(false);
	expect(
		isClubImageFile(
			new File([new Uint8Array(5 * 1024 * 1024 + 1)], "fixture", {
				type: "image/png",
			}),
		),
	).toBe(false);
});

test("stored clubs keep opaque editor IDs and never send scrape identifiers", () => {
	const club = {
		id: "legacy-source-id",
		editorId: "opaque-legacy-key",
		version: "v1",
		origin: "manual" as const,
		contentLanguage: "de" as const,
		title: "Stored Club",
		description: "Plain description",
		descriptionHtml: null,
		sourceUrl: "https://club.example.org",
		links: [],
	};
	const draft = clubWriteDraft("en", club);
	expect(draft.editorId).toBe("opaque-legacy-key");
	expect(draft.version).toBe("v1");
	expect(draft.language).toBe("en");
	expect(draft.sourceUrl).toBe("https://club.example.org");
	expect("sourceId" in draft).toBe(false);
	const fresh = clubWriteDraft("de");
	expect(fresh.editorId).toBeUndefined();
	expect(fresh.sourceUrl).toBe("");
	expect(fresh.version).toBeNull();
});
