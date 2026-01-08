import { useState } from "react";
import { useEventListener } from "./useEventListener";

export function useKeyPress(targetKey: string) {
	// State for keeping track of whether key is pressed
	const [keyPressed, setKeyPressed] = useState(false);

	// If pressed key is our target key then set to true
	function downHandler(event: KeyboardEvent) {
		if (event.key === targetKey) {
			setKeyPressed(true);
		}
	}

	// If released key is our target key then set to false
	const upHandler = (event: KeyboardEvent) => {
		if (event.key === targetKey) {
			setKeyPressed(false);
		}
	};

	// Add event listeners
	useEventListener<KeyboardEvent>("keydown", downHandler);
	useEventListener<KeyboardEvent>("keyup", upHandler);

	return keyPressed;
}

export default useKeyPress;
