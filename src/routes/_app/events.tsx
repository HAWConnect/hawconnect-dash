import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EventForm } from "#/components/events/event-form";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	type ClubEvent,
	deleteEventFn,
	listEventsFn,
} from "#/lib/events.functions";
import { formatDate, t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/_app/events")({
	loader: () => listEventsFn(),
	component: Events,
});
function Events() {
	const locale = useLocale();

	const rows = Route.useLoaderData();
	const router = useRouter();
	const [editing, setEditing] = useState<ClubEvent | null | undefined>();
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);
	return (
		<>
			<PageHeader
				title={t("Club-Veranstaltungen")}
				lead={t(
					"Eigene Veranstaltungen, getrennt von den offiziellen HAW-Quellen.",
				)}
				end={
					<Button onClick={() => setEditing(null)}>
						<Plus aria-hidden />
						{t("Veranstaltung")}
					</Button>
				}
			/>
			{editing !== undefined && (
				<EventForm
					key={editing?.id ?? "new"}
					event={editing ?? undefined}
					onClose={() => setEditing(undefined)}
				/>
			)}
			<section className="panel min-w-0 overflow-x-auto">
				{error && (
					<p role="alert" className="error-banner">
						{t(error)}
					</p>
				)}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("Veranstaltung")}</TableHead>
							<TableHead>{t("Beginn")}</TableHead>
							<TableHead>{t("Veranstalter")}</TableHead>
							<TableHead>{t("Aktionen")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell className="font-medium">
									{row.title[locale] || row.title.de}
								</TableCell>
								<TableCell>{formatDate(row.startDateTime)}</TableCell>
								<TableCell>{row.organizer}</TableCell>
								<TableCell>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => setEditing(row)}
										>
											{t("Bearbeiten")}
										</Button>
										<Button
											size="sm"
											variant="destructive"
											disabled={pending}
											onClick={async () => {
												if (
													!window.confirm(t("Veranstaltung endgültig löschen?"))
												)
													return;
												setPending(true);
												setError("");
												try {
													await deleteEventFn({
														data: { id: row.id, version: row.version },
													});
													await router.invalidate();
												} catch {
													setError("Löschen fehlgeschlagen. Bitte neu laden.");
												} finally {
													setPending(false);
												}
											}}
										>
											{t("Löschen")}
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
						{!rows.length && (
							<TableRow>
								<TableCell colSpan={4}>
									{t("Noch keine Club-Veranstaltungen.")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</section>
		</>
	);
}
