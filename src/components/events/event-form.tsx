import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { type ClubEvent, saveEventFn } from "#/lib/events.functions";
import { t, useLocale } from "#/lib/i18n";
import { getOrganizersFn } from "#/lib/organizers.functions";

function local(value?: string | null) {
	if (!value) return "";
	const d = new Date(value);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function EventForm({
	event,
	onClose,
}: {
	event?: ClubEvent;
	onClose: () => void;
}) {
	useLocale();
	const [organizerNames, setOrganizerNames] = useState<string[]>([]);
	useEffect(() => {
		let active = true;
		void getOrganizersFn()
			.then((profiles) => {
				if (active) setOrganizerNames(profiles.map((profile) => profile.name));
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, []);

	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	return (
		<form
			className="panel space-y-5"
			onSubmit={async (e) => {
				e.preventDefault();
				const form = new FormData(e.currentTarget);
				const get = (key: string) => String(form.get(key) ?? "");
				setPending(true);
				setError("");
				try {
					await saveEventFn({
						data: {
							id: event?.id,
							version: event?.version,
							title: { de: get("title_de"), en: get("title_en") },
							description: {
								de: get("description_de"),
								en: get("description_en"),
							},
							startDateTime: new Date(get("start")).toISOString(),
							endDateTime: get("end")
								? new Date(get("end")).toISOString()
								: null,
							organizer: get("organizer"),
							location: get("location"),
							url: get("url"),
						},
					});
					await router.invalidate();
					onClose();
				} catch {
					setError(
						t(
							"Speichern fehlgeschlagen. Prüfe die Angaben oder lade die Daten neu.",
						),
					);
				} finally {
					setPending(false);
				}
			}}
		>
			<h2 className="text-xl font-semibold">
				{event ? t("Veranstaltung bearbeiten") : t("Neue Club-Veranstaltung")}
			</h2>
			<Tabs defaultValue="de">
				<TabsList>
					<TabsTrigger value="de">{t("Deutsch")}</TabsTrigger>
					<TabsTrigger value="en">English</TabsTrigger>
				</TabsList>
				{(["de", "en"] as const).map((lang) => (
					<TabsContent
						key={lang}
						value={lang}
						forceMount
						className="data-[state=inactive]:hidden space-y-3"
					>
						<Label htmlFor={`title_${lang}`}>
							{t("Titel (")}
							{lang})
						</Label>
						<Input
							id={`title_${lang}`}
							name={`title_${lang}`}
							required
							maxLength={250}
							defaultValue={event?.title[lang] ?? ""}
						/>
						<Label htmlFor={`description_${lang}`}>
							{t("Beschreibung (")}
							{lang})
						</Label>
						<textarea
							id={`description_${lang}`}
							name={`description_${lang}`}
							maxLength={20000}
							className="min-h-24 w-full rounded-md border bg-background p-3"
							defaultValue={event?.description[lang] ?? ""}
						/>
					</TabsContent>
				))}
			</Tabs>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="event-start">{t("Beginn")}</Label>
					<Input
						id="event-start"
						name="start"
						type="datetime-local"
						required
						defaultValue={local(event?.startDateTime)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="event-end">{t("Ende (optional)")}</Label>
					<Input
						id="event-end"
						name="end"
						type="datetime-local"
						defaultValue={local(event?.endDateTime)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="event-organizer">{t("Veranstalter")}</Label>
					<Input
						list="organizer-profiles"
						id="event-organizer"
						name="organizer"
						required
						maxLength={250}
						defaultValue={event?.organizer ?? ""}
					/>
					<datalist id="organizer-profiles">
						{organizerNames.map((name) => (
							<option key={name} value={name} />
						))}
					</datalist>
				</div>
				<div className="space-y-2">
					<Label htmlFor="event-location">{t("Ort")}</Label>
					<Input
						id="event-location"
						name="location"
						maxLength={500}
						defaultValue={event?.location ?? ""}
					/>
				</div>
			</div>
			<Label htmlFor="event-url">{t("Veranstaltungslink (HTTPS)")}</Label>
			<Input
				id="event-url"
				name="url"
				type="url"
				pattern="https://.*"
				required
				defaultValue={event?.url ?? ""}
			/>
			{error && (
				<p role="alert" className="error-banner">
					{t(error)}
				</p>
			)}
			<div className="flex gap-3">
				<Button disabled={pending}>
					{pending ? t("Wird gespeichert…") : t("Speichern")}
				</Button>
				<Button type="button" variant="outline" onClick={onClose}>
					{t("Abbrechen")}
				</Button>
			</div>
		</form>
	);
}
