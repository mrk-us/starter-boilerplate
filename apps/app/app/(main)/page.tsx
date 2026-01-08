import { Suspense } from "react";
import { ComponentExample } from "@/features/shared/components/component-example";
import { UserData } from "@/features/shared/components/user-data";

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
