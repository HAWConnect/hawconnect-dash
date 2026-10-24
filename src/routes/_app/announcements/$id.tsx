import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementForm } from "#/components/announcements/announcement-form";
import { PageHeader } from "#/components/layout/page-header";
import { getAnnouncementFn } from "#/lib/announcements.functions";
import { t, useLocale } from "#/lib/i18n";
import { requireAnnouncementsUser } from "#/lib/require-app-user";

export const Route = createFileRoute("/_app/announcements/$id")({
	beforeLoad: ({ context }) => {
		requireAnnouncementsUser(context.user);
	},
	loader: ({ params }) => getAnnouncementFn({ data: { id: params.id } }),
	component: AnnouncementsEditPage,
});

function AnnouncementsEditPage() {
	useLocale();

	const announcement = Route.useLoaderData();

	return (
		<>
			<PageHeader
				title={announcement.title.de}
				lead={t("Ankündigung bearbeiten.")}
			/>
			<AnnouncementForm mode="edit" announcement={announcement} />
		</>
	);
}
