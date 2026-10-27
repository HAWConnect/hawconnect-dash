import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RichEditor } from "#/components/clubs/rich-editor";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { formatDate, t, useLocale } from "#/lib/i18n";
import {
	getLegalFn,
	type LegalDocument,
	type LegalDraft,
	type LegalKey,
	writeLegalFn,
} from "#/lib/legal.functions";
import { legalEditorHtml, updateLegalHtml } from "#/lib/legal-editor";
export const Route = createFileRoute("/_app/legal")({ component: Legal });
const title = (key: LegalKey) =>
	t(key === "privacy" ? "Datenschutzerklärung" : "Impressum");
function Legal() {
	useLocale();
	const [documents, setDocuments] = useState<LegalDocument[]>([]);
	const [key, setKey] = useState<LegalKey>("privacy");
	const [drafts, setDrafts] = useState<Partial<Record<LegalKey, LegalDraft>>>(
		{},
	);
	const draft = drafts[key] ?? null;
	const setDraft = (value: LegalDraft | null) =>
		setDrafts((all) => ({ ...all, [key]: value ?? undefined }));
	const [pending, setPending] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const document = documents.find((item) => item.key === key);
	const dirty =
		!!document &&
		!!draft &&
		JSON.stringify(document.draft) !== JSON.stringify(draft);
	const anyDirty = documents.some(
		(item) =>
			drafts[item.key] &&
			JSON.stringify(item.draft) !== JSON.stringify(drafts[item.key]),
	);
	useEffect(() => {
		let active = true;
		void getLegalFn()
			.then((rows) => {
				if (active) {
					setDocuments(rows);
					setDrafts(
						Object.fromEntries(rows.map((row) => [row.key, row.draft])),
					);
				}
			})
			.catch(() => {
				if (active)
					setError(
						"Rechtliche Seiten nicht verfügbar. Prüfe Berechtigung und Datenbankeinrichtung.",
					);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);
	useBlocker({
		shouldBlockFn: () =>
			pending ||
			(anyDirty && !window.confirm(t("Ungespeicherte Änderungen verwerfen?"))),
		enableBeforeUnload: anyDirty || pending,
	});

	async function write(action: "save" | "publish" | "withdraw") {
		if (!document || !draft || pending) return;
		if (
			action === "withdraw" &&
			!window.confirm(t("Veröffentlichung wirklich zurückziehen?"))
		)
			return;
		setPending(true);
		setError("");
		setNotice("");
		try {
			const saved = await writeLegalFn({
				data: {
					key,
					action,
					version: document.version,
					...(action === "save" ? { draft } : {}),
				},
			});
			setDocuments((rows) =>
				rows.map((row) => (row.key === saved.key ? saved : row)),
			);
			setDraft(saved.draft);
			setNotice(
				action === "save"
					? "Entwurf gespeichert."
					: action === "publish"
						? "Veröffentlicht. Beim nächsten Öffnen in der App verfügbar."
						: "Veröffentlichung zurückgezogen.",
			);
		} catch {
			setError(
				"Speichern fehlgeschlagen. Prüfe beide Sprachen und HTTPS-Links. Bei einem Versionskonflikt die Seite neu laden; ungespeicherte Eingaben vorher kopieren.",
			);
		} finally {
			setPending(false);
		}
	}
	return (
		<>
			<PageHeader
				title={t("Rechtliche Seiten")}
				lead={t("Datenschutzerklärung und Impressum für die App verwalten.")}
			/>
			{error && (
				<p className="error-banner" role="alert">
					{t(error)}
				</p>
			)}
			{notice && (
				<p role="status" className="text-sm text-muted-foreground">
					{t(notice)}
				</p>
			)}
			{loading ? (
				<p>{t("Laden…")}</p>
			) : (
				<div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
					<section className="panel space-y-2">
						{documents.map((item) => (
							<Button
								key={item.key}
								disabled={pending}
								variant={item.key === key ? "secondary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setKey(item.key);
									setError("");
									setNotice("");
								}}
							>
								{title(item.key)}
							</Button>
						))}
					</section>
					{document && draft && (
						<form
							className="panel space-y-5"
							onSubmit={(event) => {
								event.preventDefault();
								void write("save");
							}}
						>
							<h2 className="text-lg font-semibold">{title(key)}</h2>
							<p className="text-sm text-muted-foreground">
								{document.published
									? t("Veröffentlicht")
									: t("Nicht veröffentlicht")}
								{document.publishedAt
									? ` · ${formatDate(document.publishedAt)}`
									: ""}
							</p>
							<fieldset disabled={pending} className="space-y-5">
								<div className="space-y-2">
									<Label htmlFor="legal-mode">{t("Darstellung")}</Label>
									<select
										id="legal-mode"
										className="w-full border border-border bg-background px-3 py-2 text-sm"
										value={draft.mode}
										onChange={(event) =>
											setDraft({
												...draft,
												mode: event.target.value as LegalDraft["mode"],
											})
										}
									>
										<option value="internal">{t("Text in der App")}</option>
										<option value="external">{t("Externe HTTPS-Links")}</option>
									</select>
								</div>
								{(["de", "en"] as const).map((language) => (
									<div className="space-y-2" key={language}>
										<Label htmlFor={`legal-${language}`}>
											{t(language === "de" ? "Deutsch" : "Englisch")}
										</Label>
										{draft.mode === "internal" ? (
											<RichEditor
												key={`${key}:${document.version ?? "new"}:${language}:${draft.mode}`}
												id={`legal-${language}`}
												label={`${title(key)} · ${t(language === "de" ? "Deutsch" : "Englisch")}`}
												allowImages={false}
												disabled={pending}
												value={legalEditorHtml(draft, language)}
												onChange={(html) =>
													setDrafts((all) => {
														const current = all[key];
														return current
															? {
																	...all,
																	[key]: updateLegalHtml(
																		current,
																		language,
																		html,
																	),
																}
															: all;
													})
												}
											/>
										) : (
											<Input
												id={`legal-${language}`}
												type="url"
												maxLength={2048}
												placeholder="https://…"
												value={draft.url[language]}
												onChange={(event) =>
													setDraft({
														...draft,
														url: {
															...draft.url,
															[language]: event.target.value,
														},
													})
												}
											/>
										)}
									</div>
								))}
								<p className="text-sm text-muted-foreground">
									{t(
										"Entwürfe sind nicht öffentlich. Vor dem Veröffentlichen beide Sprachen vervollständigen und speichern. Überschriften, Hervorhebungen, Listen und Links sind möglich; Bilder nicht.",
									)}
								</p>
								<div className="flex flex-wrap gap-3">
									<Button type="submit">{t("Entwurf speichern")}</Button>
									<Button
										type="button"
										variant="secondary"
										disabled={
											dirty ||
											!document.version ||
											!(draft.mode === "internal"
												? draft.body.de && draft.body.en
												: draft.url.de && draft.url.en)
										}
										onClick={() => void write("publish")}
									>
										{t("Veröffentlichen")}
									</Button>
									{document.published && (
										<Button
											type="button"
											variant="outline"
											disabled={dirty}
											onClick={() => void write("withdraw")}
										>
											{t("Veröffentlichung zurückziehen")}
										</Button>
									)}
								</div>
							</fieldset>
						</form>
					)}
				</div>
			)}
		</>
	);
}
