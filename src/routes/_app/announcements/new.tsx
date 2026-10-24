import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementForm } from "#/components/announcements/announcement-form";
import { PageHeader } from "#/components/layout/page-header";
import { t, useLocale } from "#/lib/i18n";
import { requireAnnouncementsUser } from "#/lib/require-app-user";

export const Route = createFileRoute("/_app/announcements/new")({
	beforeLoad: ({ context }) => {
		requireAnnouncementsUser(context.user);
	},
	component: AnnouncementsNewPage,
});

function AnnouncementsNewPage() {
	useLocale();

	return (
		<>
			<PageHeader
				title={t("Neue Ankündigung")}
				lead={t("Erstelle eine neue In-App Ankündigung.")}
			/>
			<AnnouncementForm mode="create" />
		</>
	);
}
