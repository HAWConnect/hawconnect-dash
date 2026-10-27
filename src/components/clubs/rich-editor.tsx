import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { ImageSelector } from "#/components/announcements/image-selector";
import { Button } from "#/components/ui/button";
import { uploadClubImageFn } from "#/lib/clubs.functions";
import { isClubImageFile, safeClubUrl } from "#/lib/clubs-editor";
import { clubEditorExtensions } from "#/lib/clubs-rich-text";
import { formatUserError } from "#/lib/format-user-error";
import { t } from "#/lib/i18n";

export function RichEditor({
	value,
	onChange,
	disabled = false,
	onPendingChange,
	allowImages = true,
	label = t("Club-Beschreibung"),
	id,
}: {
	value: string;
	onChange: (html: string) => void;
	disabled?: boolean;
	onPendingChange?: (pending: boolean) => void;
	allowImages?: boolean;
	label?: string;
	id?: string;
}) {
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const editor = useEditor({
		immediatelyRender: false,
		shouldRerenderOnTransaction: true,
		extensions: clubEditorExtensions(allowImages),
		content: value,
		editable: !disabled,
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
		editorProps: {
			attributes: {
				role: "textbox",
				"aria-label": label,
				...(id ? { id } : {}),
				"aria-multiline": "true",
				class:
					"min-h-52 p-3 outline-none [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_a]:underline [&_img]:max-h-96 [&_img]:max-w-full",
			},
			handlePaste: (_view, event) => {
				if (event.clipboardData?.files.length) {
					setError(
						t(
							allowImages
								? "Bilder bitte über den Upload hinzufügen."
								: "Bilder sind für rechtliche Texte nicht verfügbar.",
						),
					);
					return true;
				}
				return false;
			},
		},
	});
	useEffect(() => {
		editor?.setEditable(!disabled, false);
	}, [editor, disabled]);
	async function upload(file?: File) {
		if (!allowImages || !file || !editor) return;
		setError("");
		if (!isClubImageFile(file)) {
			setError(
				t(
					"Bitte eine gültige JPEG-, PNG-, WebP- oder GIF-Datei bis 5 MB auswählen.",
				),
			);
			return;
		}
		setUploading(true);
		onPendingChange?.(true);
		try {
			const body = new FormData();
			body.set("image", file);
			const result = await uploadClubImageFn({ data: body });
			if (editor.isDestroyed) return;
			editor
				.chain()
				.focus()
				.setImage({ src: result.imageUrl, alt: file.name })
				.run();
		} catch (err) {
			setError(t(formatUserError(err)));
		} finally {
			setUploading(false);
			onPendingChange?.(false);
		}
	}
	return (
		<div className="space-y-2">
			<div
				role="toolbar"
				aria-label={t("Textformatierung")}
				className="flex flex-wrap gap-2"
			>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-label={t("Überschrift Ebene 2")}
					aria-pressed={editor?.isActive("heading", { level: 2 }) ?? false}
					onClick={() =>
						editor?.chain().focus().toggleHeading({ level: 2 }).run()
					}
				>
					H2
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-label={t("Überschrift Ebene 3")}
					aria-pressed={editor?.isActive("heading", { level: 3 }) ?? false}
					onClick={() =>
						editor?.chain().focus().toggleHeading({ level: 3 }).run()
					}
				>
					H3
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-pressed={editor?.isActive("bold") ?? false}
					onClick={() => editor?.chain().focus().toggleBold().run()}
				>
					{t("Fett")}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-pressed={editor?.isActive("italic") ?? false}
					onClick={() => editor?.chain().focus().toggleItalic().run()}
				>
					{t("Kursiv")}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-pressed={editor?.isActive("bulletList") ?? false}
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
				>
					{t("Aufzählung")}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					aria-pressed={editor?.isActive("orderedList") ?? false}
					onClick={() => editor?.chain().focus().toggleOrderedList().run()}
				>
					{t("Nummerierte Liste")}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={!editor || disabled}
					onClick={() => {
						const href = window.prompt(
							t("HTTPS- oder mailto-Link"),
							editor?.getAttributes("link").href ?? "",
						);
						if (href === null) return;
						if (!href) {
							editor?.chain().focus().unsetLink().run();
							return;
						}
						if (!safeClubUrl(href)) {
							setError(
								t("Bitte eine gültige HTTPS- oder mailto-Adresse angeben."),
							);
							return;
						}
						editor
							?.chain()
							.focus()
							.extendMarkRange("link")
							.setLink({ href })
							.run();
					}}
				>
					{t("Link")}
				</Button>
				{allowImages && (
					<>
						<Button
							type="button"
							variant="outline"
							disabled={!editor || disabled}
							onClick={() => {
								const src = window.prompt(t("HTTPS-Bildadresse"));
								if (src === null || !src.trim()) return;
								const url = src.trim();
								if (!safeClubUrl(url, true)) {
									setError(
										t(
											"Bitte eine gültige HTTPS-Bildadresse ohne Zugangsdaten angeben.",
										),
									);
									return;
								}
								setError("");
								editor?.chain().focus().setImage({ src: url, alt: "" }).run();
							}}
						>
							{t("Bild von URL")}
						</Button>
						<ImageSelector
							scope="clubs"
							onSelectImage={(image) => {
								if (!disabled && safeClubUrl(image.url, true))
									editor
										?.chain()
										.focus()
										.setImage({ src: image.url, alt: image.name })
										.run();
							}}
						/>
						<label className="inline-flex items-center border px-3 text-sm">
							{uploading ? t("Laden…") : t("Bild hochladen")}
							<input
								aria-label={t("Bild hochladen")}
								type="file"
								accept="image/jpeg,image/png,image/webp,image/gif"
								disabled={disabled || uploading}
								className="ml-2 max-w-52"
								onChange={(event) => {
									void upload(event.target.files?.[0]);
									event.target.value = "";
								}}
							/>
						</label>{" "}
					</>
				)}
			</div>
			<EditorContent editor={editor} className="border rounded" />
			{error && <p role="alert">{error}</p>}
		</div>
	);
}
