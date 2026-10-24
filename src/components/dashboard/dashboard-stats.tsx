import { Link } from "@tanstack/react-router";
import { CalendarDays, type LucideIcon, Megaphone } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import type { DashboardSummary } from "#/lib/dashboard.functions";
import { t, useLocale } from "#/lib/i18n";
export function DashboardStats({ summary }: { summary: DashboardSummary }) {
	useLocale();

	const tiles: {
		key: string;
		label: string;
		value: number;
		hint: string;
		href: "/announcements" | "/events";
		icon: LucideIcon;
	}[] = [];
	if (summary.announcements)
		tiles.push({
			key: "announcements",
			label: t("Aktive Ankündigungen"),
			value: summary.announcements.active,
			hint: `${summary.announcements.upcoming} ${t("Geplant")}`,
			href: "/announcements",
			icon: Megaphone,
		});
	if (summary.events !== null)
		tiles.push({
			key: "events",
			label: t("Club-Veranstaltungen"),
			value: summary.events,
			hint: t("Eigene Veranstaltungen"),
			href: "/events",
			icon: CalendarDays,
		});
	return (
		<section className="space-y-3">
			<h2 className="text-sm font-semibold text-muted-foreground">
				{t("Überblick")}
			</h2>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{tiles.map((tile) => {
					const Icon = tile.icon;
					return (
						<Link
							key={tile.key}
							to={tile.href}
							className="surface-panel flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
						>
							<span className="flex size-9 shrink-0 items-center justify-center border border-foreground/20 text-foreground">
								<Icon className="size-4" aria-hidden />
							</span>
							<div className="min-w-0 flex-1 space-y-1">
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm font-medium text-muted-foreground">
										{tile.label}
									</span>
									<Badge variant="outline">{tile.value}</Badge>
								</div>
								<p className="text-xs text-muted-foreground">{tile.hint}</p>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
