import {
	Activity,
	CalendarDays,
	DoorOpen,
	Globe,
	Home,
	type LucideIcon,
	Megaphone,
	ScrollText,
	Users,
} from "lucide-react";
import {
	type AppCapability,
	canAccessAnnouncements,
	canAccessAudit,
	canAccessOps,
} from "#/lib/auth";
import { ROUTES } from "#/lib/constants";

export type NavItem = {
	to: string;
	label: string;
	icon: LucideIcon;
	match: (pathname: string) => boolean;
	visible: (capabilities: AppCapability[]) => boolean;
	external?: boolean;
};

export const overviewItems: NavItem[] = [
	{
		to: ROUTES.HOME,
		label: "Übersicht",
		icon: Home,
		match: (pathname) => pathname === ROUTES.HOME,
		visible: () => true,
	},
];

export const featureItems: NavItem[] = [
	{
		to: "/quick-links",
		label: "Quick Links",
		icon: Globe,
		match: (p) => p.startsWith("/quick-links"),
		visible: canAccessOps,
	},
	{
		to: ROUTES.LEGAL,
		label: "Rechtliche Seiten",
		icon: ScrollText,
		match: (p) => p.startsWith("/legal"),
		visible: (c) => c.includes("admin"),
	},
	{
		to: ROUTES.ORGANIZERS,
		label: "Veranstalterprofile",
		icon: Users,
		match: (p) => p.startsWith("/organizers"),
		visible: (c) => c.includes("admin") || c.includes("events"),
	},
	{
		to: ROUTES.CLUBS,
		label: "Clubs",
		icon: Users,
		match: (p) => p.startsWith("/clubs"),
		visible: canAccessOps,
	},
	{
		to: ROUTES.ANNOUNCEMENTS,
		label: "Ankündigungen",
		icon: Megaphone,
		match: (p) => p.startsWith("/announcements"),
		visible: canAccessAnnouncements,
	},
	{
		to: ROUTES.EVENTS,
		label: "Club-Veranstaltungen",
		icon: CalendarDays,
		match: (p) => p.startsWith("/events"),
		visible: (c) => c.includes("admin") || c.includes("events"),
	},
	{
		to: ROUTES.OPERATIONS,
		label: "Datenquellen",
		icon: Activity,
		match: (p) => p.startsWith("/operations"),
		visible: canAccessOps,
	},
	{
		to: ROUTES.PERMISSIONS,
		label: "Berechtigungen",
		icon: DoorOpen,
		match: (p) => p.startsWith("/permissions"),
		visible: (c) => c.includes("admin"),
	},
];

export const bottomNavItems: NavItem[] = [
	{
		to: ROUTES.AUDIT_LOG,
		label: "Audit-Log",
		icon: ScrollText,
		match: (pathname) => pathname.startsWith(ROUTES.AUDIT_LOG),
		visible: canAccessAudit,
	},
];

export const externalAdminLinks: NavItem[] = [];

export function navItemsForCapabilities(
	items: NavItem[],
	capabilities: AppCapability[],
): NavItem[] {
	return items.filter((item) => item.visible(capabilities));
}
