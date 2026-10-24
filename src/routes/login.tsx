import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { HAWConnectMark } from "#/components/brand/hawconnect-mark";
import { LegalFooter } from "#/components/layout/legal-footer";
import { PageShell } from "#/components/layout/page-shell";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	getAuthStatusFn,
	passwordAdminLoginFn,
	requestAdminLinkFn,
} from "#/lib/auth.functions";
import { t, useLocale } from "#/lib/i18n";
export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const status = await getAuthStatusFn();
		if (status.user) throw redirect({ to: "/" });
		return status;
	},
	component: LoginPage,
});
function LoginPage() {
	useLocale();

	const router = useRouter();
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState(false);
	return (
		<PageShell>
			<div className="flex w-full min-w-0 flex-1 items-center justify-center p-4">
				<section className="panel w-full max-w-md">
					<HAWConnectMark className="mx-auto mb-5 h-12 w-auto text-foreground" />
					<p className="mb-2 text-center text-xs font-semibold uppercase text-muted-foreground">
						HAWConnect
					</p>
					<h1 className="text-center text-2xl font-semibold">
						HAWConnect Dash
					</h1>
					<p className="mt-2 text-center text-sm text-muted-foreground">
						{t("Verwaltung für autorisierte Hochschulangehörige.")}
					</p>
					<form
						className="mt-6 space-y-4"
						onSubmit={async (e) => {
							e.preventDefault();
							setPending(true);
							setMessage("");
							try {
								await passwordAdminLoginFn({ data: { email, password } });
								setPassword("");
								await router.invalidate();
								await router.navigate({ to: "/" });
							} catch {
								setError(true);
								setMessage(
									t(
										"Anmeldung nicht möglich. Prüfe deine Berechtigung oder versuche es später erneut.",
									),
								);
							} finally {
								setPending(false);
							}
						}}
					>
						<Label htmlFor="email">{t("HAW E-Mail-Adresse")}</Label>
						<Input
							id="email"
							type="email"
							required
							autoComplete="email"
							placeholder="name@haw-hamburg.de"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<Label htmlFor="password">{t("Passwort")}</Label>
						<Input
							id="password"
							type="password"
							required
							minLength={12}
							maxLength={128}
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={pending}
						>
							{pending ? t("Bitte warten…") : t("Mit Passwort anmelden")}
						</Button>
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={pending || !email}
							onClick={async () => {
								setPending(true);
								setMessage("");
								try {
									await requestAdminLinkFn({ data: { email } });
									setError(false);
									setMessage(
										"Anmeldelink gesendet. Bitte prüfe dein Postfach.",
									);
								} catch {
									setError(true);
									setMessage(
										t(
											"Anmeldelink konnte nicht gesendet werden. Prüfe deine Berechtigung oder versuche es später erneut.",
										),
									);
								} finally {
									setPending(false);
								}
							}}
						>
							{t("Anmeldelink senden")}
						</Button>
						{message && (
							<p
								role={error ? "alert" : "status"}
								className={
									error ? "error-banner" : "text-sm text-muted-foreground"
								}
							>
								{t(message)}
							</p>
						)}
					</form>
					<p className="mt-4 text-xs text-muted-foreground">
						{t("Ein HAW-Konto allein erteilt keinen Verwaltungszugang.")}
					</p>
				</section>
			</div>
			<LegalFooter />
		</PageShell>
	);
}
