import { describe, expect, test } from "bun:test";
import { translate } from "../i18n";
import messages from "../translations.json";

describe("dashboard localisation", () => {
	test("translates navigation and authentication while retaining German", () => {
		expect(translate("Ankündigungen", "en")).toBe("Announcements");
		expect(translate("Mit Passwort anmelden", "en")).toBe(
			"Sign in with password",
		);
		expect(translate("Ankündigungen", "de")).toBe("Ankündigungen");
	});
	test("preserves user content and unknown source text", () => {
		expect(translate("My custom event – BT7", "en")).toBe(
			"My custom event – BT7",
		);
	});
	test("keeps confirmation placeholders and provides nonempty translations", () => {
		expect(translate("Berechtigungen für {email} speichern?", "en")).toContain(
			"{email}",
		);
		for (const value of Object.values(messages))
			expect(value.trim().length).toBeGreaterThan(0);
	});
});
