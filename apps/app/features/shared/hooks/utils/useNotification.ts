import React from "react";

/**
 * useNotification
 * @param title The title of the notification.
 * @param options The options for the notification.
 * @returns A function to trigger the notification.
 */
export function useNotification(
	title: string,
	options?: NotificationOptions,
): (() => void) | undefined {
	const triggerNotification = React.useCallback(() => {
		if (!("Notification" in window)) {
			return;
		}

		if (Notification.permission !== "granted") {
			Notification.requestPermission().then((permission) => {
				if (permission === "granted") {
					new Notification(title, options);
				}
			});
		} else {
			new Notification(title, options);
		}
	}, [title, options]);

	if (!("Notification" in window)) {
		return undefined;
	}

	return triggerNotification;
}
