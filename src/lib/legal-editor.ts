import { plainToHtml } from "./clubs-editor";
import type { LegalDraft } from "./legal.functions";

type Language = "de" | "en";
export function legalEditorHtml(draft: LegalDraft, language: Language): string {
	return draft.bodyHtml?.[language] ?? plainToHtml(draft.body[language]);
}
export function updateLegalHtml(
	draft: LegalDraft,
	language: Language,
	html: string,
): LegalDraft {
	return {
		...draft,
		bodyHtml: {
			de: legalEditorHtml(draft, "de"),
			en: legalEditorHtml(draft, "en"),
			[language]: html,
		},
	};
}
