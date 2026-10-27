import { randomUUID } from "node:crypto";
import {
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import { MAX_IMAGE_BYTES } from "./image-policy";

export { MAX_IMAGE_BYTES } from "./image-policy";
export interface R2Config {
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	publicUrl: string;
	prefix: string;
}
export interface ListedImage {
	name: string;
	url: string;
	size?: number;
	uploadedAt?: string;
}
interface StoredObject {
	key?: string;
	size?: number;
	uploadedAt?: Date;
}
export interface StorageTransport {
	put(input: {
		key: string;
		bytes: Uint8Array;
		contentType: string;
	}): Promise<void>;
	list(
		token?: string,
	): Promise<{ objects: StoredObject[]; nextToken?: string }>;
}
export function readR2Config(
	env: Record<string, string | undefined> = process.env,
): R2Config {
	const get = (name: string) => env[`HAWCONNECT_R2_${name}`]?.trim() ?? "";
	const config = {
		accountId: get("ACCOUNT_ID"),
		bucket: get("BUCKET"),
		accessKeyId: get("ACCESS_KEY_ID"),
		secretAccessKey: get("SECRET_ACCESS_KEY"),
		publicUrl: get("PUBLIC_URL"),
		prefix: get("PREFIX") || "dash-images/",
	};
	try {
		const url = new URL(config.publicUrl);
		if (
			!/^[a-f0-9]{32}$/i.test(config.accountId) ||
			!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(config.bucket) ||
			!config.accessKeyId ||
			!config.secretAccessKey ||
			url.protocol !== "https:" ||
			url.username ||
			url.password ||
			url.search ||
			url.hash ||
			!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(config.prefix)
		)
			throw Error();
		config.publicUrl = url.toString().replace(/\/+$/, "");
		config.prefix = `${config.prefix.replace(/\/+$/, "")}/`;
		return config;
	} catch {
		throw Error("ImageStorageNotConfigured");
	}
}
function imageType(bytes: Uint8Array) {
	const starts = (...values: number[]) =>
		values.every((v, i) => bytes[i] === v);
	if (starts(137, 80, 78, 71, 13, 10, 26, 10))
		return { type: "image/png", extension: "png" };
	if (starts(255, 216, 255)) return { type: "image/jpeg", extension: "jpg" };
	const ascii = (start: number, end: number) =>
		String.fromCharCode(...bytes.slice(start, end));
	if (["GIF87a", "GIF89a"].includes(ascii(0, 6)))
		return { type: "image/gif", extension: "gif" };
	if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
		return { type: "image/webp", extension: "webp" };
	throw Error("InvalidImage");
}
export function createImageStorage(
	config: R2Config,
	transport: StorageTransport,
) {
	const publicUrl = (key: string) =>
		`${config.publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
	return {
		async upload(value: unknown): Promise<{ imageUrl: string }> {
			if (
				!(value instanceof File) ||
				value.size === 0 ||
				value.size > MAX_IMAGE_BYTES
			)
				throw Error("InvalidImage");
			const bytes = new Uint8Array(await value.arrayBuffer());
			const detected = imageType(bytes);
			if (value.type !== detected.type) throw Error("InvalidImage");
			const key = `${config.prefix}${randomUUID()}.${detected.extension}`;
			try {
				await transport.put({ key, bytes, contentType: detected.type });
			} catch {
				throw Error("ImageStorageUnavailable");
			}
			return { imageUrl: publicUrl(key) };
		},
		async list(): Promise<ListedImage[]> {
			const images: ListedImage[] = [];
			let token: string | undefined;
			const seen = new Set<string>();
			try {
				for (let page = 0; page < 10; page++) {
					const result = await transport.list(token);
					for (const item of result.objects) {
						const key = item.key;
						if (
							!key?.startsWith(config.prefix) ||
							key.slice(config.prefix.length).startsWith("clubs/") ||
							!/\.(png|jpe?g|gif|webp)$/i.test(key) ||
							key
								.split("/")
								.some((part) => !part || part === "." || part === "..")
						)
							continue;
						images.push({
							name: key.slice(config.prefix.length),
							url: publicUrl(key),
							size: item.size,
							uploadedAt: item.uploadedAt?.toISOString(),
						});
					}
					token = result.nextToken;
					if (!token)
						return images.sort((a, b) =>
							(b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""),
						);
					if (seen.has(token)) throw Error();
					seen.add(token);
				}
				throw Error();
			} catch {
				throw Error("ImageStorageUnavailable");
			}
		},
	};
}
/** Credentials and S3 transport stay in the Dash server; access is checked by server functions. */
export function scopeImageConfig(config: R2Config, scope?: "clubs"): R2Config {
	return scope ? { ...config, prefix: `${config.prefix}clubs/` } : config;
}
export function getImageStorage(scope?: "clubs") {
	const config = scopeImageConfig(readR2Config(), scope);
	const client = new S3Client({
		region: "auto",
		endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		maxAttempts: 3,
		requestChecksumCalculation: "WHEN_REQUIRED",
		requestHandler: { connectionTimeout: 3000, requestTimeout: 15000 },
	});
	const storage = createImageStorage(config, {
		async put({ key, bytes, contentType }) {
			await client.send(
				new PutObjectCommand({
					Bucket: config.bucket,
					Key: key,
					Body: bytes,
					ContentType: contentType,
					ContentLength: bytes.byteLength,
					ContentDisposition: "inline",
					CacheControl: "public, max-age=31536000, immutable",
				}),
			);
		},
		async list(token) {
			const result = await client.send(
				new ListObjectsV2Command({
					Bucket: config.bucket,
					Prefix: config.prefix,
					MaxKeys: 1000,
					ContinuationToken: token,
				}),
			);
			if (result.IsTruncated && !result.NextContinuationToken) throw Error();
			return {
				objects: (result.Contents ?? []).map((item) => ({
					key: item.Key,
					size: item.Size,
					uploadedAt: item.LastModified,
				})),
				nextToken: result.NextContinuationToken,
			};
		},
	});
	return {
		async upload(file: unknown) {
			try {
				return await storage.upload(file);
			} finally {
				client.destroy();
			}
		},
		async list() {
			try {
				return await storage.list();
			} finally {
				client.destroy();
			}
		},
	};
}
