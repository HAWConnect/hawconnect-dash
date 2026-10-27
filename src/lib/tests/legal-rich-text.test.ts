import { expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import { Window } from "happy-dom";
import { clubEditorExtensions } from "../clubs-rich-text";

test("legal WYSIWYG drops even HTTPS images while retaining text formatting", () => {
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
			extensions: clubEditorExtensions(false),
			content:
				'<h2>Legal</h2><p><strong>Text</strong><img src="https://assets.example.org/a.png"><a href="https://example.org">Link</a></p>',
		});
		const html = editor.getHTML();
		expect(html).toContain("<h2>Legal</h2>");
		expect(html).toContain("<strong>Text</strong>");
		expect(html).toContain("https://example.org");
		expect(html).not.toContain("<img");
		expect(html).not.toContain("assets.example.org");
		editor.destroy();
	} finally {
		Object.assign(globalThis, original);
		fixture.happyDOM.abort();
	}
});
