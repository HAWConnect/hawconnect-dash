import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { getAuthStatusFn } from "#/lib/auth.functions";
import { clientShellScript } from "#/lib/client-shell";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	headers: () => ({
		"Cache-Control": "private, no-store",
	}),
	beforeLoad: async () => {
		const status = await getAuthStatusFn();
		return status;
	},
	staleTime: 60_000,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{ title: "HAWConnect Dash" },
			{
				name: "robots",
				content: "noindex, nofollow, noarchive, nosnippet",
			},
			{
				name: "theme-color",
				content: "#020302",
				media: "(prefers-color-scheme: dark)",
			},
			{
				name: "theme-color",
				content: "#f5f8f5",
				media: "(prefers-color-scheme: light)",
			},
			{
				name: "description",
				content: "HAWConnect Verwaltungsoberfläche",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
		],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	return <Outlet />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: theme bootstrap before paint
					dangerouslySetInnerHTML={{ __html: clientShellScript }}
				/>
			</head>
			<body className="min-h-screen min-w-0 max-w-full bg-background font-sans text-foreground antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
