import { Loader2 } from "lucide-react";
import { t, useLocale } from "#/lib/i18n";
import { cn } from "#/lib/utils";

type SpinnerProps = {
	label?: string;
	className?: string;
};

export function Spinner({ label = t("Laden…"), className }: SpinnerProps) {
	useLocale();

	return (
		<output
			className={cn(
				"flex w-full flex-col items-center justify-center gap-3 p-8",
				className,
			)}
			aria-live="polite"
			aria-busy="true"
			aria-label={t(label)}
		>
			<Loader2 className="size-8 animate-spin text-primary" aria-hidden />
			<p className="m-0 text-center text-sm text-muted-foreground">
				{t(label)}
			</p>
		</output>
	);
}
