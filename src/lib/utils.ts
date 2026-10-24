import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Format API times like `14:30:00` → `14:30`. Leaves `HH:mm` unchanged. */
export function formatTime(value: string | null | undefined): string {
	if (!value) return "";
	const match = /^(\d{1,2}:\d{2})(?::\d{2})?/.exec(value.trim());
	return match?.[1] ?? value;
}

export const weekdays = {
	Monday: { de: "Montag", en: "Monday", order: 1 },
	Tuesday: { de: "Dienstag", en: "Tuesday", order: 2 },
	Wednesday: { de: "Mittwoch", en: "Wednesday", order: 3 },
	Thursday: { de: "Donnerstag", en: "Thursday", order: 4 },
	Friday: { de: "Freitag", en: "Friday", order: 5 },
	Saturday: { de: "Samstag", en: "Saturday", order: 6 },
	Sunday: { de: "Sonntag", en: "Sunday", order: 7 },
} as const;

export type Weekday = keyof typeof weekdays;
