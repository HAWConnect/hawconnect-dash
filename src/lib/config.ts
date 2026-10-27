const optional = (name: string, fallback = "") =>
	process.env[name]?.trim() || fallback;
export const serverConfig = {
	appUrl: optional("APP_URL", "http://localhost:43127"),
	coreapi: {
		url: optional(
			"HAWCONNECT_ADMIN_API_URL",
			"http://localhost:4000/api/admin",
		),
	},
	authMock: false,
};
export function assertSessionSecret() {
	const secret = process.env.SESSION_SECRET;
	if (!secret || secret.length < 32)
		throw Error("SESSION_SECRET must contain at least 32 characters");
	if (
		process.env.NODE_ENV === "production" &&
		(!serverConfig.appUrl.startsWith("https://") ||
			!serverConfig.coreapi.url.startsWith("https://"))
	)
		throw Error("Production HTTPS required");
	return secret;
}
