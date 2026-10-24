import { setLocale, useLocale } from "#/lib/i18n";
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
	const locale = useLocale();
	return (
		<label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
			<span className="sr-only">
				{locale === "en" ? "Language" : "Sprache"}
			</span>
			<select
				aria-label={locale === "en" ? "Language" : "Sprache"}
				className="h-9 border border-border bg-background px-2 text-foreground"
				value={locale}
				onChange={(event) => setLocale(event.target.value as "de" | "en")}
			>
				<option value="de">{compact ? "DE" : "Deutsch"}</option>
				<option value="en">{compact ? "EN" : "English"}</option>
			</select>
		</label>
	);
}
