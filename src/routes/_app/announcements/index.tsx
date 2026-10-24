import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AnnouncementsTable } from "#/components/announcements/announcements-table";
import { PageHeader } from "#/components/layout/page-header";
import { Button } from "#/components/ui/button";
import { listAnnouncementsFn } from "#/lib/announcements.functions";
import { ROUTES } from "#/lib/constants";
import { t, useLocale } from "#/lib/i18n";
import { requireAnnouncementsUser } from "#/lib/require-app-user";

export const Route = createFileRoute("/_app/announcements/")({
	beforeLoad: ({ context }) => {
		requireAnnouncementsUser(context.user);
	},
	loader: () => listAnnouncementsFn(),
	component: AnnouncementsIndexPage,
});

function AnnouncementsIndexPage() {
	useLocale();

	const announcements = Route.useLoaderData();

	return (
		<>
			<PageHeader
				title={t("Ankündigungen")}
				lead={t("In-App Ankündigungen verwalten.")}
				end={
					<Button asChild>
						<Link to={ROUTES.ANNOUNCEMENTS_NEW}>
							<Plus aria-hidden />
							{t("Neu")}
						</Link>
					</Button>
				}
			/>
			<AnnouncementsTable announcements={announcements} />
		</>
	);
}
