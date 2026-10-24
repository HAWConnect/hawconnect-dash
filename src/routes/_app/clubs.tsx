import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "#/components/layout/page-header";
import { type ClubDirectory, getClubsFn } from "#/lib/clubs.functions";
import { t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/_app/clubs")({ component: Clubs });
function Clubs() {
	const locale = useLocale();
	const [data, setData] = useState<ClubDirectory>();
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		let current = true;
		setData(undefined);
		setFailed(false);
		void getClubsFn({ data: { language: locale } })
			.then((value) => {
				if (current) setData(value);
			})
			.catch(() => {
				if (current) setFailed(true);
			});
		return () => {
			current = false;
		};
	}, [locale]);
	return (
		<>
			<PageHeader
				title="Clubs"
				lead={t(
					"Studentische Projekte und Initiativen der HAW Hamburg. Inhalte werden von der offiziellen Website übernommen.",
				)}
			/>
			{failed || (data && !data.available) ? (
				<p role="alert">{t("Clubs konnten nicht geladen werden.")}</p>
			) : !data ? (
				<p role="status">{t("Laden…")}</p>
			) : (
				<>
					<a
						className="text-primary underline"
						href={data.sourceUrl}
						target="_blank"
						rel="noreferrer"
					>
						{t("HAW-Website öffnen")} ↗
					</a>
					<div className="grid gap-4 md:grid-cols-2">
						{data.clubs.map((club) => (
							<section className="panel space-y-3" key={club.id}>
								<h2 className="font-semibold">{club.title}</h2>
								<p className="whitespace-pre-line text-sm text-muted-foreground">
									{club.description}
								</p>
								<a
									href={club.sourceUrl}
									className="text-primary underline"
									target="_blank"
									rel="noreferrer"
								>
									{t("Mehr lesen")} ↗
								</a>
							</section>
						))}
					</div>
				</>
			)}
		</>
	);
}
