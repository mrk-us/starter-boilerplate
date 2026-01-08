import { CompleteSetup } from "@/features/setup";

export default function SetupPage() {
	return (
		<main className="flex flex-col mx-auto max-w-md gap-6 p-6 justify-center items-center min-h-screen">
			<div className="text-center space-y-2">
				<h1 className="text-2xl font-semibold">Welcome! Let's get started</h1>
				<p className="text-muted-foreground">
					Please enter your name to complete your account setup.
				</p>
			</div>
			<div className="w-full">
				<CompleteSetup />
			</div>
		</main>
	);
}
