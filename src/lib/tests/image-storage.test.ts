import { describe, expect, test } from "bun:test";
import {
	createImageStorage,
	MAX_IMAGE_BYTES,
	readR2Config,
	type StorageTransport,
} from "../image-storage.server";

const config = {
	accountId: "a".repeat(32),
	bucket: "assets",
	accessKeyId: "key",
	secretAccessKey: "secret",
	publicUrl: "https://assets.example.org",
	prefix: "dash-images/",
};
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
function transport() {
	const writes: unknown[] = [];
	const api: StorageTransport = {
		put: async (input) => {
			writes.push(input);
		},
		list: async () => ({ objects: [] }),
	};
	return { api, writes };
}
describe("R2 image storage", () => {
	test("requires complete runtime configuration and HTTPS public URLs", () => {
		expect(() => readR2Config({})).toThrow("ImageStorageNotConfigured");
		const env = {
			HAWCONNECT_R2_ACCOUNT_ID: config.accountId,
			HAWCONNECT_R2_BUCKET: config.bucket,
			HAWCONNECT_R2_ACCESS_KEY_ID: config.accessKeyId,
			HAWCONNECT_R2_SECRET_ACCESS_KEY: config.secretAccessKey,
			HAWCONNECT_R2_PUBLIC_URL: config.publicUrl,
		};
		expect(readR2Config(env).prefix).toBe("dash-images/");
		for (const publicUrl of [
			"http://assets.example.org",
			"https://user:pass@assets.example.org",
			"https://assets.example.org/?token=x",
		])
			expect(() =>
				readR2Config({ ...env, HAWCONNECT_R2_PUBLIC_URL: publicUrl }),
			).toThrow("ImageStorageNotConfigured");
		for (const prefix of ["../", "/", "other//images", "images/../"])
			expect(() =>
				readR2Config({ ...env, HAWCONNECT_R2_PREFIX: prefix }),
			).toThrow("ImageStorageNotConfigured");
	});
	test("validates content before writing and never uses an original filename as key", async () => {
		const { api, writes } = transport();
		const store = createImageStorage(config, api);
		const result = await store.upload(
			new File([png], "../../personal-name.svg", { type: "image/png" }),
		);
		expect(result.imageUrl).toMatch(
			/^https:\/\/assets\.example\.org\/dash-images\/[a-f0-9-]+\.png$/,
		);
		expect(JSON.stringify(writes)).not.toContain("personal-name");
		expect(writes).toHaveLength(1);
		for (const file of [
			new File([], "empty.png", { type: "image/png" }),
			new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }),
			new File(["<html>"], "a.png", { type: "image/png" }),
			new File([png], "a.jpg", { type: "image/jpeg" }),
			new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "a.png", {
				type: "image/png",
			}),
		])
			await expect(store.upload(file)).rejects.toThrow("InvalidImage");
		expect(writes).toHaveLength(1);
	});
	test("accepts supported signatures, rejects arbitrary and missing file inputs", async () => {
		const { api } = transport();
		const store = createImageStorage(config, api);
		for (const [bytes, type] of [
			[new Uint8Array([255, 216, 255, 224]), "image/jpeg"],
			[new TextEncoder().encode("GIF89a...."), "image/gif"],
			[
				new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]),
				"image/webp",
			],
		] as const)
			expect(
				(await store.upload(new File([bytes], "test", { type }))).imageUrl,
			).toStartWith(config.publicUrl);
		await expect(store.upload(null)).rejects.toThrow("InvalidImage");
		await expect(store.upload("not a file")).rejects.toThrow("InvalidImage");
	});
	test("paginates only the managed prefix and returns newest images first", async () => {
		const calls: unknown[] = [];
		const store = createImageStorage(config, {
			put: async () => {},
			list: async (token) => {
				calls.push(token);
				return token
					? {
							objects: [
								{
									key: "dash-images/new.png",
									size: 30,
									uploadedAt: new Date("2026-10-26"),
								},
							],
						}
					: {
							objects: [
								{ key: "outside/private.png" },
								{ key: "dash-images/code.svg" },
								{
									key: "dash-images/old.jpg",
									size: 20,
									uploadedAt: new Date("2026-10-25"),
								},
							],
							nextToken: "page2",
						};
			},
		});
		const items = await store.list();
		expect(calls).toEqual([undefined, "page2"]);
		expect(items.map((i) => i.name)).toEqual(["new.png", "old.jpg"]);
		expect(items[0].url).toBe("https://assets.example.org/dash-images/new.png");
	});
	test("sanitizes transport errors without publishing a success URL", async () => {
		const store = createImageStorage(config, {
			put: async () => {
				throw Error("secret credential detail");
			},
			list: async () => {
				throw Error("secret credential detail");
			},
		});
		await expect(
			store.upload(new File([png], "a.png", { type: "image/png" })),
		).rejects.toThrow("ImageStorageUnavailable");
		await expect(store.list()).rejects.toThrow("ImageStorageUnavailable");
	});
});
