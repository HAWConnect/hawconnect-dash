import { expect, test } from "bun:test";
import { legalEditorHtml, updateLegalHtml } from "../legal-editor";

const legacy = {
	mode: "internal" as const,
	body: { de: "<strong>Literal</strong>\nNext", en: "English & <text>" },
	url: { de: "", en: "" },
};
test("legacy legal content is escaped for editing without converting or mutating the draft", () => {
	const before = JSON.stringify(legacy);
	expect(legalEditorHtml(legacy, "de")).toBe(
		"<p>&lt;strong&gt;Literal&lt;/strong&gt;<br>Next</p>",
	);
	expect(JSON.stringify(legacy)).toBe(before);
	expect("bodyHtml" in legacy).toBe(false);
});
test("first edit creates HTML for both languages and leaves fallback plain body for server derivation", () => {
	const result = updateLegalHtml(
		legacy,
		"de",
		"<h2>New</h2><p><strong>Text</strong></p>",
	);
	expect(result.bodyHtml).toEqual({
		de: "<h2>New</h2><p><strong>Text</strong></p>",
		en: "<p>English &amp; &lt;text&gt;</p>",
	});
	expect(result.body).toEqual(legacy.body);
	expect("bodyHtml" in legacy).toBe(false);
});
test("existing rich content and mode changes retain the untouched language and URL fields", () => {
	const rich = updateLegalHtml(legacy, "en", "<p><em>English</em></p>");
	const external = {
		...rich,
		mode: "external" as const,
		url: { de: "https://example.org/de", en: "https://example.org/en" },
	};
	expect(legalEditorHtml(external, "en")).toBe("<p><em>English</em></p>");
	expect(
		updateLegalHtml({ ...external, mode: "internal" }, "de", "<h3>Deutsch</h3>")
			.bodyHtml?.en,
	).toBe("<p><em>English</em></p>");
	expect(external.url.de).toBe("https://example.org/de");
});
