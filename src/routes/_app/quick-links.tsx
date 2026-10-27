import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, icons, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { t, useLocale } from "#/lib/i18n";
import {
	getQuickLinksFn,
	type QuickLink,
	type QuickLinksDocument,
	quickLinkIcons,
	saveQuickLinksFn,
} from "#/lib/quick-links.functions";
export const Route = createFileRoute("/_app/quick-links")({
	component: QuickLinks,
});
function QuickLinks() {
	const language = useLocale();
	const [document, setDocument] = useState<QuickLinksDocument | null>(null);
	const [links, setLinks] = useState<QuickLink[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const dirty =
		!!document && JSON.stringify(document.links) !== JSON.stringify(links);
	useBlocker({
		shouldBlockFn: () =>
			pending ||
			(dirty && !window.confirm(t("Ungespeicherte Änderungen verwerfen?"))),
		enableBeforeUnload: dirty || pending,
	});
	useEffect(() => {
		let active = true;
		void getQuickLinksFn()
			.then((value) => {
				if (active) {
					setDocument(value);
					setLinks(value.links);
					setError("");
				}
			})
			.catch(() => {
				if (active)
					setError(
						"Quick Links nicht verfügbar. Prüfe Berechtigung und Datenbankeinrichtung.",
					);
			});
		return () => {
			active = false;
		};
	}, []);
	const current = links.find((link) => link.key === selected);
	function update(value: Partial<QuickLink>) {
		setNotice("");
		setLinks((all) =>
			all.map((link) => (link.key === selected ? { ...link, ...value } : link)),
		);
	}
	function move(index: number, delta: number) {
		setLinks((all) => {
			const next = [...all];
			const target = index + delta;
			if (target >= 0 && target < next.length)
				[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	}
	async function save() {
		if (!document || pending) return;
		setPending(true);
		setError("");
		setNotice("");
		try {
			const result = await saveQuickLinksFn({
				data: { links, version: document.version },
			});
			setDocument(result);
			setLinks(result.links);
			setNotice("Quick Links gespeichert.");
		} catch {
			setError(
				"Speichern fehlgeschlagen. Prüfe beide Sprachen und HTTPS-Links. Bei einem Konflikt lade die Seite neu; deine Änderungen bleiben hier erhalten.",
			);
		} finally {
			setPending(false);
		}
	}
	return (
		<div className="space-y-6">
			<PageHeader
				title="Quick Links"
				lead={t("Links und Symbole für die App verwalten.")}
			/>
			{error && (
				<p role="alert" className="text-destructive">
					{t(error)}
				</p>
			)}
			{notice && <p role="status">{t(notice)}</p>}
			{!document && !error && <p>{t("Laden…")}</p>}
			{document && (
				<>
					<div className="flex gap-2">
						<Button
							onClick={() => {
								const key = crypto.randomUUID();
								setLinks((all) => [
									...all,
									{
										key,
										title: { de: "", en: "" },
										url: { de: "", en: "" },
										icon: "Link",
										visible: true,
									},
								]);
								setSelected(key);
							}}
							disabled={pending || links.length >= 100}
						>
							<Plus size={16} />
							{t("Link hinzufügen")}
						</Button>
						<Button onClick={() => void save()} disabled={pending || !dirty}>
							{t(pending ? "Speichern…" : "Speichern")}
						</Button>
					</div>
					<fieldset
						disabled={pending}
						className="grid min-w-0 gap-6 lg:grid-cols-2"
					>
						<div className="min-w-0 space-y-2">
							{links.map((link, index) => {
								const Icon = icons[link.icon];
								return (
									<div
										key={link.key}
										className={`flex items-center gap-2 rounded-lg border p-3 ${selected === link.key ? "border-primary" : ""}`}
									>
										<button
											type="button"
											className="flex min-w-0 flex-1 items-center gap-3 text-left"
											onClick={() => setSelected(link.key)}
										>
											<Icon size={22} />
											<span className="truncate">
												{link.title[language] || t("Neuer Link")}
												{!link.visible && ` · ${t("Ausgeblendet")}`}
											</span>
										</button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={t("Nach oben")}
											disabled={index === 0}
											onClick={() => move(index, -1)}
										>
											<ArrowUp size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={t("Nach unten")}
											disabled={index === links.length - 1}
											onClick={() => move(index, 1)}
										>
											<ArrowDown size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={t("Link löschen")}
											onClick={() => {
												if (window.confirm(t("Link wirklich löschen?"))) {
													setLinks((all) =>
														all.filter((x) => x.key !== link.key),
													);
													if (selected === link.key) setSelected(null);
												}
											}}
										>
											<Trash2 size={16} />
										</Button>
									</div>
								);
							})}
							{links.length === 0 && (
								<p>{t("Keine Quick Links. Füge einen Link hinzu.")}</p>
							)}
						</div>
						{current && (
							<div className="min-w-0 space-y-4 rounded-lg border p-4">
								{(["de", "en"] as const).map((locale) => (
									<div key={locale} className="space-y-2">
										<Label htmlFor={`title-${locale}`}>
											{t("Titel")} ({locale.toUpperCase()})
										</Label>
										<Input
											id={`title-${locale}`}
											maxLength={120}
											value={current.title[locale]}
											onChange={(e) =>
												update({
													title: { ...current.title, [locale]: e.target.value },
												})
											}
										/>
										<Label htmlFor={`url-${locale}`}>
											URL ({locale.toUpperCase()})
										</Label>
										<Input
											id={`url-${locale}`}
											type="url"
											maxLength={2048}
											placeholder="https://"
											value={current.url[locale]}
											onChange={(e) =>
												update({
													url: { ...current.url, [locale]: e.target.value },
												})
											}
										/>
									</div>
								))}
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										checked={current.visible}
										onChange={(e) => update({ visible: e.target.checked })}
									/>
									{t("In der App anzeigen")}
								</label>
								<Label htmlFor="icon-search">{t("Symbol auswählen")}</Label>
								<Input
									id="icon-search"
									placeholder={t("Symbole suchen…")}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
								<fieldset
									aria-label={t("Symbol auswählen")}
									className="grid grid-cols-3 gap-2 sm:grid-cols-4"
								>
									{quickLinkIcons
										.filter((name) =>
											name.toLowerCase().includes(search.toLowerCase()),
										)
										.map((name) => {
											const Icon = icons[name];
											return (
												<button
													key={name}
													type="button"
													aria-pressed={current.icon === name}
													onClick={() => update({ icon: name })}
													className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs ${current.icon === name ? "border-primary bg-primary/10" : ""}`}
												>
													<Icon size={25} />
													<span>{name}</span>
												</button>
											);
										})}
								</fieldset>
							</div>
						)}
					</fieldset>
				</>
			)}
		</div>
	);
}
