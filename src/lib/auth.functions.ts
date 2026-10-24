import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "#/lib/admin-api";
import { getSessionUser } from "#/lib/auth.server";
import { getAppSession } from "#/lib/session";
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(() =>
	getSessionUser(),
);
export const getAuthStatusFn = createServerFn({ method: "GET" }).handler(
	async () => ({
		user: await getSessionUser(),
		authMock: false,
		authConfigured: true,
	}),
);
export const requestAdminLinkFn = createServerFn({ method: "POST" })
	.validator((data: { email: string }) => {
		const email = data.email?.trim().toLowerCase();
		if (!/^[^@\s]+@haw-hamburg\.de$/.test(email))
			throw Error("Bitte eine @haw-hamburg.de Adresse verwenden.");
		return { email };
	})
	.handler(async ({ data }) => {
		await adminRequest("/auth/request-link", undefined, "POST", data);
		return { ok: true };
	});
export const confirmAdminLinkFn = createServerFn({ method: "POST" })
	.validator((data: { token: string }) => {
		if (
			typeof data.token !== "string" ||
			data.token.length < 16 ||
			data.token.length > 512
		)
			throw Error("Ungültiger Anmeldelink");
		return data;
	})
	.handler(async ({ data }) => {
		const result = await adminRequest<{ token: string }>(
			"/auth/confirm",
			undefined,
			"POST",
			data,
		);
		await (await getAppSession()).update({ accessToken: result.token });
		return { ok: true };
	});

export const passwordAdminLoginFn = createServerFn({ method: "POST" })
	.validator((data: { email: string; password: string }) => {
		const email = data.email?.trim().toLowerCase();
		if (
			!/^[^@\s]+@haw-hamburg\.de$/.test(email) ||
			typeof data.password !== "string" ||
			data.password.length < 12 ||
			data.password.length > 128
		)
			throw Error("Anmeldedaten ungültig");
		return { email, password: data.password };
	})
	.handler(async ({ data }) => {
		const result = await adminRequest<{ token: string }>(
			"/auth/password",
			undefined,
			"POST",
			data,
		);
		await (await getAppSession()).update({ accessToken: result.token });
		return { ok: true };
	});
