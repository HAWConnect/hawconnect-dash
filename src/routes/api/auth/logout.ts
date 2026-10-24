import { createFileRoute } from "@tanstack/react-router";
import { buildLogoutRedirectUrl } from "#/lib/auth.server";
import { serverConfig } from "#/lib/config";
export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				if (
					request.headers.get("origin") !== new URL(serverConfig.appUrl).origin
				)
					return new Response("Forbidden", { status: 403 });
				try {
					await buildLogoutRedirectUrl();
				} catch {}
				return new Response(null, {
					status: 303,
					headers: { Location: "/login" },
				});
			},
		},
	},
});
