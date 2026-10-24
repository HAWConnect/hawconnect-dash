import { expect, test } from "bun:test";
import { newAnnouncementSchema } from "../schemas/announcements";

const valid = {
	title: { de: "Titel", en: "Title" },
	description: { de: "Text", en: "Text" },
	startDateTime: new Date("2026-11-01T10:00:00Z"),
	endDateTime: new Date("2026-11-02T10:00:00Z"),
	priority: 0,
	platform: ["WEB"],
	userKind: ["STUDENT"],
	url: null,
	imageUrl: null,
};
test("rejects unsafe links, reversed schedules and out-of-range priority before submission", () => {
	expect(newAnnouncementSchema.safeParse(valid).success).toBe(true);
	for (const input of [
		{ ...valid, url: "javascript:alert(1)" },
		{ ...valid, endDateTime: new Date("2026-10-01T10:00:00Z") },
		{ ...valid, priority: 1000 },
		{ ...valid, title: { de: "", en: "Title" } },
	])
		expect(newAnnouncementSchema.safeParse(input).success).toBe(false);
});
