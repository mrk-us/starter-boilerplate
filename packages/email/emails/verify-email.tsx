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

export default function VerifyEmail({
	code,
	url,
}: {
	code: string;
	url: string;
}) {
	return (
		<Html>
			<Head />
			<Preview>Your verification code is {code}</Preview>
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
						{/* <Section className="mt-4">
							<Img alt="Framer" className="mx-0 my-0" height="50" src="https://d3b9kr64nievew.cloudfront.net/cm1rki22e0174akkvdbsg2yzi/cm1rkyfp8000l1sulf3ko6p6v.png" width="50" />
						</Section> */}

						<Section className="mt-0">
							<Heading className="mx-0 mb-8 p-0 font-medium text-[20px] text-primary">
								Your verification code.
							</Heading>
							<Text className="text-[16px] text-secondary">
								Enter the following code to{" "}
								<Link href={url}>verify your email address</Link>.
							</Text>
						</Section>

						<Section className="mt-4 rounded-2xl border border-border bg-card p-4 text-center">
							<Text className="font-medium font-mono text-[24px] text-primary tracking-widest">
								{code}
							</Text>
						</Section>

						<Section className="mt-6">
							<Text className="m-0 text-[16px] text-secondary">
								This code will expire in 10 minutes. Do not share this code with
								anyone.
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
