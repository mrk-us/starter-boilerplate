import React from "react";
import { isClient } from "../../utils/isClient";

export function useEventListener<T extends Event = Event>(
	eventName: string,
	handler: (event: T) => void,
	element = isClient ? window : undefined,
) {
	const savedHandler = React.useRef<((event: T) => void) | null>(null);

	React.useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	React.useEffect(() => {
		// Make sure element supports addEventListener on client side
		if (!element?.addEventListener) return;

		const eventListener = (event: Event) => {
			if (savedHandler.current) {
				savedHandler.current(event as T);
			}
		};
		element.addEventListener(eventName, eventListener);

		return () => {
			element.removeEventListener(eventName, eventListener);
		};
	}, [eventName, element]);
}
