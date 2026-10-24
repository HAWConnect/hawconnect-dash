export const APP_NAME = "HAWConnect Dash" as const;

export const EXTERNAL_LINKS = {
	WEBSITE: "https://www.haw-hamburg.de/",
	WEBSITE_IMPRESSUM: import.meta.env.VITE_IMPRINT_URL || "",
	WEBSITE_DATENSCHUTZ: import.meta.env.VITE_PRIVACY_URL || "",
	ANALYTICS: "",
	STATUS: "",
	CAMPUS_LIFE: "",
} as const;

export const ROUTES = {
	LEGAL: "/legal",
	ORGANIZERS: "/organizers",
	CLUBS: "/clubs",
	HOME: "/",
	EVENTS: "/events",
	OPERATIONS: "/operations",
	PERMISSIONS: "/permissions",
	LOGIN: "/login",
	NO_ACCESS: "/no-access",
	ANNOUNCEMENTS: "/announcements",
	ANNOUNCEMENTS_NEW: "/announcements/new",
	ROOM_REPORTS: "/roomreports",
	AUDIT_LOG: "/auditlog",
	AUTH_LOGIN: "/api/auth/login",
	AUTH_LOGOUT: "/api/auth/logout",
} as const;
