import type { SVGProps } from "react";
import mark from "../../../public/hawconnect-mark.json";
export function HAWConnectMark(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox={mark.viewBox}
			fill="none"
			role="img"
			aria-label="HAWConnect"
			{...props}
		>
			{mark.paths.map((path) => (
				<path
					key={path.d}
					d={path.d}
					fill={path.stroke ? "none" : "currentColor"}
					stroke={path.stroke ? "currentColor" : undefined}
					strokeWidth={path.stroke ? 20 : undefined}
					strokeLinecap="round"
				/>
			))}
		</svg>
	);
}
