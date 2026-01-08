import React from "react";

/**
 * useDebounce
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

	React.useEffect(() => {
		// Timeout to update the debounced value after the specified delay.
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Clear the timeout if the value changes before the delay has passed,
		// or if the component unmounts.
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * useDebouncedCallback
 * @param callback The function to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns A debounced version of the callback function.
 */

export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
	callback: T,
	delay: number,
): (...args: Parameters<T>) => void {
	const callbackRef = React.useRef(callback);
	const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	// Keep callback ref up to date
	React.useLayoutEffect(() => {
		callbackRef.current = callback;
	});

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return React.useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	);
}
