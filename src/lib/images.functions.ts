import { createServerFn } from "@tanstack/react-start";
import { requireCapability } from "#/lib/auth.server";
import { getImageStorage } from "#/lib/image-storage.server";

export type { ListedImage } from "#/lib/image-storage.server";

export const listImagesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("announcements");
		return getImageStorage().list();
	},
);
export const uploadImageFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => {
		if (!(data instanceof FormData)) throw Error("InvalidImage");
		return data;
	})
	.handler(async ({ data }): Promise<{ imageUrl: string }> => {
		await requireCapability("announcements");
		return getImageStorage().upload(data.get("image"));
	});
