import {
	clearSession,
	getSession,
	updateSession,
} from "@tanstack/react-start/server";
import { assertSessionSecret } from "#/lib/config";

const config = () => ({
	name: "hawconnect-dash-session",
	password: assertSessionSecret(),
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 8,
		path: "/",
	},
});
type Data = { accessToken?: string };
export async function getAppSession() {
	const c = config();
	const session = await getSession<Data>(c);
	return {
		data: session.data,
		update: async (data: Data) => {
			await updateSession<Data>(c, data);
		},
		clear: async () => {
			await clearSession(c);
		},
	};
}
