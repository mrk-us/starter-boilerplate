import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { APP_URL } from "@repo/config";

export default function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
	return (
		<Html>
			<Head />
			<Preview>Reset your password</Preview>
			<Tailwind
				config={{
					darkMode: "class",
					theme: {
						extend: {
							fontFamily: {
								sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
							},
							colors: {
								brand: "#0099ff",
								primary: "#000000",
								secondary: "#333333",
								card: "#f4f4f4",
								border: "#e9e9e9",
							},
						},
					},
				}}
			>
				<Body className="font-sans">
					<Container className="mx-auto px-0 py-5">
						<Section className="mt-0">
							<Heading className="mx-0 mb-8 p-0 font-medium text-[20px] text-primary">
								Reset your password
							</Heading>
							<Text className="text-[16px] text-secondary">
								We received a request to reset your password. Click the link
								below to choose a new password.
							</Text>
						</Section>

						<Section className="mt-4">
							<Link
								href={resetUrl}
								className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-[16px] text-white no-underline"
							>
								Reset Password
							</Link>
						</Section>

						<Section className="mt-6">
							<Text className="m-0 text-[16px] text-secondary">
								This link will expire in 24 hours.
							</Text>
							<Text className="mt-4 text-[14px] text-secondary/70">
								If you didn't request a password reset, you can safely ignore
								this email. Your password will not be changed.
							</Text>
						</Section>

						<Section className="mt-4">
							<Text className="m-0 text-[16px] text-secondary">Have fun,</Text>
							<Text className="m-0 text-[16px] text-secondary">
								Unremarkable
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
