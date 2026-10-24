import { createFileRoute, Link } from "@tanstack/react-router";
import { AuditTable } from "#/components/audit/audit-table";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { listAuditLogFn } from "#/lib/audit.functions";
import { t, useLocale } from "#/lib/i18n";
import { requireAuditUser } from "#/lib/require-app-user";
export const Route = createFileRoute("/_app/auditlog")({
	validateSearch: (search: Record<string, unknown>) => ({
		offset: Math.min(
			100000,
			Math.max(0, Math.floor(Number(search.offset) || 0)),
		),
	}),
	loaderDeps: ({ search }) => ({ offset: search.offset }),
	beforeLoad: ({ context }) => {
		requireAuditUser(context.user);
	},
	loader: ({ deps }) =>
		listAuditLogFn({ data: { limit: 100, cursor: String(deps.offset) } }),
	component: Audit,
});
function Audit() {
	useLocale();

	const entries = Route.useLoaderData();
	const { offset } = Route.useSearch();
	return (
		<>
			<PageHeader
				title={t("Audit-Log")}
				lead={t("Protokoll administrativer Änderungen.")}
			/>
			<AuditTable entries={entries} />
			<div className="flex items-center justify-between gap-3">
				<Button variant="outline" disabled={!offset} asChild>
					<Link to="/auditlog" search={{ offset: Math.max(0, offset - 100) }}>
						{t("Zurück")}
					</Link>
				</Button>
				<span className="text-sm text-muted-foreground">
					{t("Einträge")}
					{offset + 1}–{offset + entries.length}
				</span>
				<Button variant="outline" disabled={entries.length < 100} asChild>
					<Link to="/auditlog" search={{ offset: offset + 100 }}>
						{t("Weiter")}
					</Link>
				</Button>
			</div>
		</>
	);
}
