"use client";

import type { ReactNode } from "react";
import { isElectron } from "@/utils";

type ElectronWindowProps = {
	children: ReactNode;
};

export function ElectronWindow({ children }: ElectronWindowProps) {
	const isElectronRuntime = isElectron();

	if (isElectronRuntime) {
		return (
			<div className="rounded-[24px] w-dvw h-dvh window bg-page fixed overflow-hidden">
				<div className="size-full overflow-auto">{children}</div>
			</div>
		);
	}

	return children;
}
