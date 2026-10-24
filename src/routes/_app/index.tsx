import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardStats } from "#/components/dashboard/dashboard-stats";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { getDashboardSummaryFn } from "#/lib/dashboard.functions";
import { t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/_app/")({
	loader: () => getDashboardSummaryFn(),
	component: Home,
});
function Home() {
	useLocale();

	const { user } = Route.useRouteContext();
	const summary = Route.useLoaderData();
	return (
		<>
			<PageHeader
				title={`${t("Hallo")} ${user.name}`}
				lead={t("HAWConnect – Inhalte und öffentliche Daten verwalten.")}
			/>
			<DashboardStats summary={summary} />
			{summary.announcements && (
				<section className="panel space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">{t("Ankündigungen")}</h2>
						<Button variant="outline" asChild>
							<Link to="/announcements">{t("Alle anzeigen")}</Link>
						</Button>
					</div>
					{summary.announcements.recent.length ? (
						summary.announcements.recent.map((row) => (
							<Link
								key={row.id}
								to="/announcements/$id"
								params={{ id: row.id }}
								className="flex justify-between border-b py-3 text-sm"
							>
								<span>{row.title}</span>
								<span className="text-muted-foreground">
									{row.status === "active" ? t("Aktiv") : t("Geplant")}
								</span>
							</Link>
						))
					) : (
						<p className="text-sm text-muted-foreground">
							{t("Keine aktiven oder geplanten Ankündigungen.")}
						</p>
					)}
				</section>
			)}
			{summary.services && (
				<section className="panel space-y-3">
					<h2 className="text-lg font-semibold">{t("Datenquellen")}</h2>
					{summary.services.map((row) => (
						<div
							key={t(row.name)}
							className="flex justify-between border-b py-3 text-sm"
						>
							<span>{t(row.name)}</span>
							<span className="text-muted-foreground">
								{!row.available
									? t("Nicht verfügbar")
									: row.stale
										? t("Veralteter Cache")
										: t("Verfügbar")}
							</span>
						</div>
					))}
				</section>
			)}
		</>
	);
}
