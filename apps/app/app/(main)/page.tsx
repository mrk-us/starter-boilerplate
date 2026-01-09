import { Suspense } from "react";
import { ComponentExample, UserData } from "@/features/shared/components";

export default function Home() {
	return (
		<main className="flex flex-col mx-auto max-w-5xl gap-10 p-6 justify-center items-center">
			<h1>Dashboard</h1>

			<Suspense fallback={<div>Loading...</div>}>
				<UserData />
			</Suspense>
			<ComponentExample />
		</main>
	);
}
