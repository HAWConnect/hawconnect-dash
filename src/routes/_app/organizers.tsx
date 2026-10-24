import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { t, useLocale } from "#/lib/i18n";
import {
	getOrganizersFn,
	type OrganizerProfile,
	saveOrganizerFn,
} from "#/lib/organizers.functions";
export const Route = createFileRoute("/_app/organizers")({
	component: Organizers,
});
function Organizers() {
	useLocale();
	const [profiles, setProfiles] = useState<OrganizerProfile[]>([]);
	const [editing, setEditing] = useState<OrganizerProfile | null>(null);
	const [saved, setSaved] = useState(false);
	const [loading, setLoading] = useState(true),
		[pending, setPending] = useState(false),
		[error, setError] = useState("");
	useEffect(() => {
		let active = true;
		void getOrganizersFn()
			.then((rows) => {
				if (active) setProfiles(rows);
			})
			.catch(() => {
				if (active)
					setError(
						"Veranstalterprofile nicht verfügbar. Die Datenbankeinrichtung ist möglicherweise noch ausstehend.",
					);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);
	return (
		<>
			<PageHeader
				title={t("Veranstalterprofile")}
				lead={t("Profile für Campus-Life-Veranstaltungen verwalten.")}
				end={
					<Button
						disabled={pending}
						onClick={() => {
							setEditing(null);
							setError("");
							setSaved(false);
						}}
					>
						{t("Neues Profil")}
					</Button>
				}
			/>
			{error && (
				<p role="alert" className="error-banner">
					{t(error)}
				</p>
			)}
			{saved && (
				<p role="status" className="text-sm text-muted-foreground">
					{t("Profil gespeichert.")}
				</p>
			)}
			<div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
				<section className="panel space-y-2">
					<h2 className="font-semibold">{t("Veranstalter")}</h2>
					{loading ? (
						<p>{t("Laden…")}</p>
					) : (
						profiles.map((profile) => (
							<Button
								className="w-full justify-start"
								variant={editing?.id === profile.id ? "secondary" : "ghost"}
								key={profile.id}
								disabled={pending}
								onClick={() => {
									setEditing(profile);
									setError("");
									setSaved(false);
								}}
							>
								{profile.name}
							</Button>
						))
					)}
				</section>
				<form
					className="panel space-y-4"
					key={editing?.id ?? "new"}
					onSubmit={async (event) => {
						event.preventDefault();
						setPending(true);
						setError("");
						setSaved(false);
						const form = new FormData(event.currentTarget);
						const text = (key: string) => String(form.get(key) ?? "");
						try {
							const saved = await saveOrganizerFn({
								data: {
									name: editing?.name ?? text("name"),
									description: {
										de: text("description-de"),
										en: text("description-en"),
									},
									location: text("location") || null,
									website: text("website") || null,
									instagram: text("instagram") || null,
									linkedin: text("linkedin") || null,
									nonProfit:
										text("nonProfit") === "unknown"
											? null
											: text("nonProfit") === "true",
									registrationNumber: text("registrationNumber") || null,
									version: editing?.version ?? null,
								},
							});
							setProfiles((rows) =>
								[
									...rows.filter((profile) => profile.id !== saved.id),
									saved,
								].sort((a, b) => a.name.localeCompare(b.name)),
							);
							setEditing(saved);
							setSaved(true);
						} catch {
							setError(
								"Speichern fehlgeschlagen. Bitte neu laden und erneut versuchen.",
							);
						} finally {
							setPending(false);
						}
					}}
				>
					<fieldset disabled={pending} className="contents">
						<h2 className="font-semibold">
							{editing?.name ?? t("Neues Profil")}
						</h2>
						<Label htmlFor="organizer-name">{t("Name")}</Label>
						<Input
							id="organizer-name"
							name="name"
							required
							maxLength={250}
							defaultValue={editing?.name ?? ""}
							readOnly={!!editing}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							{(["de", "en"] as const).map((language) => (
								<div className="space-y-2" key={language}>
									<Label htmlFor={`description-${language}`}>
										{t(
											language === "de"
												? "Beschreibung (Deutsch)"
												: "Beschreibung (Englisch)",
										)}
									</Label>
									<textarea
										id={`description-${language}`}
										name={`description-${language}`}
										maxLength={20000}
										className="min-h-32 w-full rounded-md border border-input bg-background p-3 text-sm"
										defaultValue={editing?.description[language] ?? ""}
									/>
								</div>
							))}
						</div>
						{(
							[
								["location", "Ort"],
								["website", "Website"],
								["instagram", "Instagram"],
								["linkedin", "LinkedIn"],
								["registrationNumber", "Registernummer"],
							] as const
						).map(([field, label]) => (
							<div className="space-y-2" key={field}>
								<Label htmlFor={`profile-${field}`}>{t(label)}</Label>
								<Input
									id={`profile-${field}`}
									name={field}
									type={
										["website", "instagram", "linkedin"].includes(field)
											? "url"
											: "text"
									}
									maxLength={
										field === "registrationNumber"
											? 250
											: field === "location"
												? 500
												: 2048
									}
									defaultValue={editing?.[field] ?? ""}
									placeholder={
										["website", "instagram", "linkedin"].includes(field)
											? "https://"
											: undefined
									}
								/>
							</div>
						))}
						<div className="space-y-2">
							<Label htmlFor="profile-nonprofit">{t("Gemeinnützig")}</Label>
							<select
								id="profile-nonprofit"
								name="nonProfit"
								className="h-10 w-full border border-input bg-background px-3 text-sm"
								defaultValue={
									editing?.nonProfit == null
										? "unknown"
										: String(editing.nonProfit)
								}
							>
								<option value="unknown">{t("Nicht angegeben")}</option>
								<option value="true">{t("Ja")}</option>
								<option value="false">{t("Nein")}</option>
							</select>
						</div>
						<Button disabled={pending || loading}>
							{t(pending ? "Wird gespeichert…" : "Profil speichern")}
						</Button>
					</fieldset>
				</form>
			</div>
		</>
	);
}
