import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "#/components/layout/page-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { formatDate, t, useLocale } from "#/lib/i18n";
import { getServiceStatusFn } from "#/lib/operations.functions";
export const Route = createFileRoute("/_app/operations")({
	loader: () => getServiceStatusFn(),
	component: Operations,
});
function Operations() {
	useLocale();

	const rows = Route.useLoaderData();
	const router = useRouter();
	return (
		<>
			<PageHeader
				title={t("Datenquellen")}
				lead={t(
					"Verfügbarkeit und tatsächliche letzte Aktualisierung der öffentlichen Daten.",
				)}
				end={
					<Button variant="outline" onClick={() => void router.invalidate()}>
						{t("Status aktualisieren")}
					</Button>
				}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{rows.map((row) => (
					<section key={t(row.name)} className="panel space-y-3">
						<h2 className="text-lg font-semibold">{t(row.name)}</h2>
						<Badge
							variant={row.available && !row.stale ? "default" : "secondary"}
						>
							{!row.available
								? t("Nicht verfügbar")
								: row.stale
									? t("Veralteter Cache")
									: t("Verfügbar")}
						</Badge>
						<p className="text-sm text-muted-foreground">
							{t("Letzte Aktualisierung:")}{" "}
							{row.updatedAt
								? formatDate(row.updatedAt)
								: t("Keine erfolgreiche Aktualisierung")}
						</p>
					</section>
				))}
			</div>
		</>
	);
}
