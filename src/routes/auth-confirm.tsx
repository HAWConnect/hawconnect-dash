import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "#/components/layout/page-shell";
import { Button } from "#/components/ui/button";
import { confirmAdminLinkFn } from "#/lib/auth.functions";
import { t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/auth-confirm")({ component: Confirm });
function Confirm() {
	useLocale();

	const router = useRouter();
	const once = useRef(false);
	const [error, setError] = useState(false);
	useEffect(() => {
		if (once.current) return;
		once.current = true;
		const token = new URLSearchParams(window.location.hash.slice(1)).get(
			"token",
		);
		window.history.replaceState(null, "", "/auth-confirm");
		if (!token) {
			setError(true);
			return;
		}
		void confirmAdminLinkFn({ data: { token } })
			.then(async () => {
				await router.invalidate();
				await router.navigate({ to: "/" });
			})
			.catch(() => setError(true));
	}, [router]);
	return (
		<PageShell>
			<section className="panel mx-auto mt-16 max-w-md">
				<h1 className="text-xl font-semibold">
					{error
						? t("Anmeldelink ungültig oder abgelaufen")
						: t("Anmeldung wird bestätigt…")}
				</h1>
				{error && (
					<Button asChild className="mt-4">
						<a href="/login">{t("Zur Anmeldung")}</a>
					</Button>
				)}
			</section>
		</PageShell>
	);
}
