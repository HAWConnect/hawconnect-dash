import { expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import { Window } from "happy-dom";
import { clubEditorExtensions } from "../clubs-rich-text";

test("WYSIWYG preserves formatting and strips unsafe pasted HTML attributes and URLs", () => {
	const fixture = new Window({ url: "https://fixture.invalid" });
	const original = {
		window: globalThis.window,
		document: globalThis.document,
		navigator: globalThis.navigator,
	};
	Object.assign(globalThis, {
		window: fixture,
		document: fixture.document,
		navigator: fixture.navigator,
	});
	try {
		const editor = new Editor({
			element: fixture.document.createElement("div") as unknown as HTMLElement,
			extensions: clubEditorExtensions(),
			content:
				'<h2>Club</h2><p><strong>Bold</strong><em>Italic</em><a href="javascript:alert(1)" onclick="alert(1)">bad</a><a href="https://example.org">good</a><img src="data:image/svg+xml,test"><img src="https://assets.example.org/a.png" onerror="alert(1)"><script>alert(1)</script></p><ul><li>Item</li></ul>',
		});
		const html = editor.getHTML();
		expect(html).toContain("<h2>Club</h2>");
		expect(html).toContain("<strong>Bold</strong>");
		expect(html).toContain("<em>Italic</em>");
		expect(html).toContain("<ul>");
		expect(html).toContain("https://example.org");
		expect(html).toContain("https://assets.example.org/a.png");
		for (const unsafe of [
			"javascript:",
			"data:",
			"onclick",
			"onerror",
			"<script",
		])
			expect(html).not.toContain(unsafe);
		editor.destroy();
	} finally {
		Object.assign(globalThis, original);
		fixture.happyDOM.abort();
	}
});
