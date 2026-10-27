import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { safeClubUrl } from "./clubs-editor";

const SafeImage = Image.extend({
	parseHTML() {
		return [
			{
				tag: "img[src]",
				getAttrs: (node) =>
					safeClubUrl((node as HTMLElement).getAttribute("src") ?? "", true)
						? null
						: false,
			},
		];
	},
});
export function clubEditorExtensions(allowImages = true) {
	return [
		StarterKit.configure({
			code: false,
			codeBlock: false,
			horizontalRule: false,
			strike: false,
			underline: false,
			heading: { levels: [2, 3] },
			link: {
				openOnClick: false,
				autolink: false,
				isAllowedUri: (url) => safeClubUrl(url),
			},
		}),
		...(allowImages ? [SafeImage.configure({ allowBase64: false })] : []),
	];
}
