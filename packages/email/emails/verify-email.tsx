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
import { APP_NAME } from "@repo/config";

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
              colors: {
                border: "#e9e9e9",
                brand: "#0099ff",
                card: "#f4f4f4",
                primary: "#000000",
                secondary: "#333333",
              },
              fontFamily: {
                sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
              },
            },
          },
        }}
      >
        <Body className="font-sans">
          <Container className="mx-auto px-0 py-5">
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
                This code will expire in 10 minutes.
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 text-[16px] text-secondary">Thanks,</Text>
              <Text className="m-0 text-[16px] text-secondary">{APP_NAME}</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
