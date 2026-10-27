import { createServerFn } from "@tanstack/react-start";
import { adminRequest } from "./admin-api";
import { requireAccessToken, requireCapability } from "./auth.server";
export const quickLinkIcons = [
	"GraduationCap",
	"FolderOpen",
	"Library",
	"LayoutGrid",
	"FileText",
	"Mail",
	"CircleUser",
	"Globe",
	"ShoppingCart",
	"Link",
	"BookOpen",
	"Calendar",
	"MapPin",
	"Users",
	"Heart",
	"Info",
	"ExternalLink",
	"Laptop",
	"Coffee",
	"Building",
	"Bell",
	"Briefcase",
	"Code",
	"MessageCircle",
] as const;
export interface QuickLink {
	key: string;
	title: { de: string; en: string };
	url: { de: string; en: string };
	icon: (typeof quickLinkIcons)[number];
	visible: boolean;
}
export interface QuickLinksDocument {
	managed: boolean;
	version: string | null;
	links: QuickLink[];
}
export const getQuickLinksFn = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireCapability("ops");
		return adminRequest<QuickLinksDocument>(
			"/quick-links",
			(await requireAccessToken()).accessToken,
		);
	},
);
export const saveQuickLinksFn = createServerFn({ method: "POST" })
	.validator((data: { links: QuickLink[]; version: string | null }) => data)
	.handler(async ({ data }) => {
		await requireCapability("ops");
		return adminRequest<QuickLinksDocument>(
			"/quick-links",
			(await requireAccessToken()).accessToken,
			"POST",
			data,
		);
	});
