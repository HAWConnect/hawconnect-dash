import { useEffect, useSyncExternalStore } from "react";
import messages from "./translations.json";
export type Locale = "de" | "en";
const key = "hawconnect-dash-locale";
let locale: Locale = "de";
const listeners = new Set<() => void>();
export function translate(text: string, language: Locale = locale): string {
	return language === "en"
		? ((messages as Record<string, string>)[text] ?? text)
		: text;
}
export const t = translate;
export function setLocale(value: Locale) {
	if (value !== "de" && value !== "en") return;
	locale = value;
	try {
		localStorage.setItem(key, value);
	} catch {
		/* Storage may be disabled. */
	}
	document.documentElement.lang = value;
	document.dispatchEvent(new Event("hawconnect:theme-hydrate"));
	for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
export function useLocale() {
	const value = useSyncExternalStore(
		subscribe,
		() => locale,
		() => "de" as Locale,
	);
	useEffect(() => {
		try {
			const saved = localStorage.getItem(key);
			if (saved === "de" || saved === "en") {
				if (saved !== locale) setLocale(saved);
			}
		} catch {
			/* Storage may be disabled. */
		}
		const sync = (event: StorageEvent) => {
			if (
				event.key === key &&
				(event.newValue === "de" || event.newValue === "en")
			)
				setLocale(event.newValue);
		};
		window.addEventListener("storage", sync);
		return () => window.removeEventListener("storage", sync);
	}, []);
	return value;
}
export function formatDate(value: string | Date) {
	return new Date(value).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
}
