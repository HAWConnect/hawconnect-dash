import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RichEditor } from "#/components/clubs/rich-editor";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import {
	type AdminClub,
	type ClubDirectory,
	type ClubWrite,
	deleteClubFn,
	getClubsFn,
	saveClubFn,
} from "#/lib/clubs.functions";
import { clubWriteDraft, safeClubUrl } from "#/lib/clubs-editor";
import { formatUserError } from "#/lib/format-user-error";
import { t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/_app/clubs")({ component: Clubs });
type Draft = {
	key: string;
	club?: AdminClub;
	value: ClubWrite;
	dirty: boolean;
};
function problem(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	if (message.includes("InvalidInput"))
		return t("Eingaben ungültig. Bitte Pflichtfelder prüfen.");
	if (message.includes("ClubsSetupRequired"))
		return t(
			"Clubs müssen zuerst eingerichtet werden. Bitte die Clubs-Migration im Backend ausführen lassen.",
		);
	if (/conflict|409|version/i.test(message))
		return t(
			"Dieser Club wurde inzwischen geändert. Entwurf behalten und die Liste neu laden, bevor Sie erneut bearbeiten.",
		);
	return t(formatUserError(error, t("Clubs konnten nicht geladen werden.")));
}
function Clubs() {
	const locale = useLocale();
	const [data, setData] = useState<ClubDirectory>();
	const [error, setError] = useState("");
	const [writing, setBusy] = useState(false);
	const [uploading, setUploading] = useState(false);
	const busy = writing || uploading;
	const [revision, setRevision] = useState(0);
	const [drafts, setDrafts] = useState<Record<string, Draft>>({});
	const draft = drafts[locale];
	// biome-ignore lint/correctness/useExhaustiveDependencies: revision explicitly reloads the directory.
	useEffect(() => {
		let current = true;
		setData(undefined);
		setError("");
		void getClubsFn({ data: { language: locale } })
			.then((value) => {
				if (current) setData(value);
			})
			.catch((err) => {
				if (current) setError(problem(err));
			});
		return () => {
			current = false;
		};
	}, [locale, revision]);
	const dirty = Object.values(drafts).some((value) => value.dirty);
	useBlocker({
		shouldBlockFn: () =>
			busy ||
			(dirty && !window.confirm(t("Ungespeicherte Änderungen verwerfen?"))),
		enableBeforeUnload: dirty || busy,
	});
	function edit(club?: AdminClub) {
		if (
			draft?.dirty &&
			!window.confirm(t("Ungespeicherte Änderungen verwerfen?"))
		)
			return;
		setDrafts((all) => ({
			...all,
			[locale]: {
				key: crypto.randomUUID(),
				club,
				dirty: false,
				value: clubWriteDraft(locale, club),
			},
		}));
	}
	function change(values: Partial<ClubWrite>) {
		setDrafts((all) => ({
			...all,
			[locale]: {
				...all[locale],
				dirty: true,
				value: { ...all[locale].value, ...values },
			},
		}));
	}
	function close() {
		if (
			draft?.dirty &&
			!window.confirm(t("Ungespeicherte Änderungen verwerfen?"))
		)
			return;
		setDrafts((all) => {
			const next = { ...all };
			delete next[locale];
			return next;
		});
	}
	async function save() {
		if (!draft) return;
		const language = locale;
		setBusy(true);
		setError("");
		try {
			if (
				!safeClubUrl(draft.value.sourceUrl, true) ||
				draft.value.links.some((link) => !safeClubUrl(link.url))
			)
				throw Error(
					t("Bitte eine gültige HTTPS- oder mailto-Adresse angeben."),
				);
			await saveClubFn({ data: draft.value });
			setDrafts((all) => {
				const next = { ...all };
				delete next[language];
				return next;
			});
			setRevision((value) => value + 1);
		} catch (err) {
			setError(problem(err));
		} finally {
			setBusy(false);
		}
	}
	async function remove(club: AdminClub) {
		if (
			!club.version ||
			!window.confirm(t("Diesen Club in allen Sprachen löschen?"))
		)
			return;

		if (
			Object.values(drafts).some(
				(item) => item.club?.editorId === club.editorId && item.dirty,
			) &&
			!window.confirm(t("Ungespeicherte Änderungen verwerfen?"))
		)
			return;
		setBusy(true);
		setError("");
		try {
			await deleteClubFn({
				data: { editorId: club.editorId, version: club.version },
			});
			setDrafts((all) =>
				Object.fromEntries(
					Object.entries(all).filter(
						([, item]) => item.club?.editorId !== club.editorId,
					),
				),
			);
			setRevision((value) => value + 1);
		} catch (err) {
			setError(problem(err));
		} finally {
			setBusy(false);
		}
	}
	return (
		<>
			<PageHeader
				title="Clubs"
				lead={t(
					"Studentische Projekte und Initiativen der HAW Hamburg zentral verwalten.",
				)}
			/>
			<div className="flex gap-2">
				<Button disabled={busy} onClick={() => edit()}>
					{t("Neuer Club")}
				</Button>
				<Button
					variant="outline"
					disabled={busy}
					onClick={() => setRevision((value) => value + 1)}
				>
					{t("Liste neu laden")}
				</Button>
			</div>
			{error && <p role="alert">{error}</p>}
			{draft && (
				<form
					className="panel space-y-4"
					key={`${locale}:${draft.key}`}
					onSubmit={(event) => {
						event.preventDefault();
						void save();
					}}
				>
					<h2>
						{t("Club bearbeiten")} · {locale.toUpperCase()}
					</h2>
					{draft.club?.contentLanguage &&
						draft.club.contentLanguage !== locale && (
							<p role="status">
								{t("Angezeigte Sprache:")}{" "}
								{draft.club.contentLanguage.toUpperCase()}.{" "}
								{t(
									"Speichern erstellt die Übersetzung in der aktuellen Sprache.",
								)}
							</p>
						)}
					<label className="block">
						{t("Titel")}
						<input
							className="block w-full border p-2"
							required
							maxLength={300}
							disabled={busy}
							value={draft.value.title}
							onChange={(event) => change({ title: event.target.value })}
						/>
					</label>
					<RichEditor
						onPendingChange={setUploading}
						value={draft.value.descriptionHtml}
						disabled={busy}
						onChange={(descriptionHtml) => change({ descriptionHtml })}
					/>
					<label className="block">
						{t("Website (HTTPS)")}
						<input
							className="block w-full border p-2"
							type="url"
							required
							disabled={busy}
							maxLength={2048}
							value={draft.value.sourceUrl}
							onChange={(event) => change({ sourceUrl: event.target.value })}
						/>
					</label>
					<fieldset disabled={busy} className="space-y-2">
						<legend>{t("Links")}</legend>
						{draft.value.links.map((link, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: controlled stateless link inputs retain their current values.
							<div className="flex gap-2" key={`${index}`}>
								<input
									aria-label={t("Linktitel")}
									className="border p-2"
									maxLength={300}
									value={link.title}
									onChange={(event) =>
										change({
											links: draft.value.links.map((item, i) =>
												i === index
													? { ...item, title: event.target.value }
													: item,
											),
										})
									}
								/>
								<input
									aria-label={t("Linkadresse")}
									className="border p-2 flex-1"
									maxLength={2048}
									value={link.url}
									onChange={(event) =>
										change({
											links: draft.value.links.map((item, i) =>
												i === index
													? { ...item, url: event.target.value }
													: item,
											),
										})
									}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										change({
											links: draft.value.links.filter((_, i) => i !== index),
										})
									}
								>
									{t("Entfernen")}
								</Button>
							</div>
						))}
						<Button
							type="button"
							variant="outline"
							disabled={draft.value.links.length >= 30}
							onClick={() =>
								change({
									links: [...draft.value.links, { title: "", url: "" }],
								})
							}
						>
							{t("Link hinzufügen")}
						</Button>
					</fieldset>
					<div className="flex gap-2">
						<Button disabled={busy} type="submit">
							{t("Speichern")}
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={close}
						>
							{t("Abbrechen")}
						</Button>
					</div>
					<p className="text-sm">
						{t("Entwürfe bleiben beim Sprachwechsel erhalten.")}
					</p>
				</form>
			)}
			{!data && !error && <p role="status">{t("Laden…")}</p>}
			{data && (
				<>
					{data.clubs.length === 0 && (
						<p role="status">
							{t("Noch keine Clubs vorhanden. Erstellen Sie den ersten Club.")}
						</p>
					)}
					<div className="grid gap-4 md:grid-cols-2">
						{data.clubs.map((club) => (
							<section
								key={club.editorId ?? club.id}
								className="panel space-y-3"
							>
								<h2 className="font-semibold">{club.title}</h2>
								<p className="whitespace-pre-line text-sm text-muted-foreground">
									{club.description}
								</p>
								{safeClubUrl(club.sourceUrl, true) && (
									<a
										href={club.sourceUrl}
										target="_blank"
										rel="noreferrer"
										className="underline"
									>
										{t("Website öffnen")} ↗
									</a>
								)}
								<div className="flex gap-2">
									<Button
										disabled={busy || !club.editorId}
										onClick={() => edit(club)}
									>
										{t("Bearbeiten")}
									</Button>
									{club.version && (
										<Button
											variant="outline"
											disabled={busy}
											onClick={() => void remove(club)}
										>
											{t("Löschen")}
										</Button>
									)}
								</div>
							</section>
						))}
					</div>
				</>
			)}
		</>
	);
}
