import { EXTERNAL_LINKS } from "#/lib/constants";
import { t, useLocale } from "#/lib/i18n";
import { cn } from "#/lib/utils";
import { LanguageSwitch } from "./language-switch";
export function LegalFooter({ className }: { className?: string }) {
	useLocale();

	return (
		<footer
			className={cn(
				"page-gutter w-full border-t border-border/60 py-6 text-center text-xs text-muted-foreground",
				className,
			)}
		>
			<div className="mb-3">
				<LanguageSwitch />
			</div>
			<nav className="flex justify-center gap-4">
				{EXTERNAL_LINKS.WEBSITE_IMPRESSUM && (
					<a href={EXTERNAL_LINKS.WEBSITE_IMPRESSUM}>{t("Impressum")}</a>
				)}
				{EXTERNAL_LINKS.WEBSITE_DATENSCHUTZ && (
					<a href={EXTERNAL_LINKS.WEBSITE_DATENSCHUTZ}>{t("Datenschutz")}</a>
				)}
			</nav>
			<p className="mt-2">© 2026 HAWConnect</p>
		</footer>
	);
}
