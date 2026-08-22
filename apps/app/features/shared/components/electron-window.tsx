import type { ReactNode } from "react";

type ElectronWindowProps = {
	children: ReactNode;
};

/**
 * The desktop window frame. A pass-through in a browser (`display: contents`);
 * under the Electron shell the `.electron` root class turns it into a fixed,
 * non-scrolling frame with a draggable strip reserved for the native titlebar.
 *
 * Deliberately server-rendered and free of runtime checks: identical markup on
 * web and desktop, with the root class doing all the branching.
 */
export function ElectronWindow({ children }: ElectronWindowProps) {
	return (
		<div className="contents electron:fixed electron:inset-0 electron:block electron:overflow-hidden electron:bg-page">
			<div
				aria-hidden="true"
				className="hidden electron:block electron:fixed electron:inset-x-0 electron:top-0 electron:h-(--titlebar-height) electron:[app-region:drag]"
			/>
			<div className="contents electron:block electron:size-full electron:overflow-auto electron:pt-(--titlebar-height)">
				{children}
			</div>
		</div>
	);
}
