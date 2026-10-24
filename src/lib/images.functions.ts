import { createServerFn } from "@tanstack/react-start";
import { requireCapability } from "#/lib/auth.server";
export type ListedImage = {
	name: string;
	url: string;
	size?: number;
	uploadedAt?: string;
};
export const listImagesFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<ListedImage[]> => {
		await requireCapability("announcements");
		throw Error(
			"Bildspeicher ist nicht konfiguriert. Bitte eine HTTPS-Bildadresse verwenden.",
		);
	},
);
export const uploadImageFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => data)
	.handler(async (): Promise<{ imageUrl: string }> => {
		await requireCapability("announcements");
		throw Error(
			"Bild-Uploads sind nicht konfiguriert. Bitte eine HTTPS-Bildadresse verwenden.",
		);
	});
