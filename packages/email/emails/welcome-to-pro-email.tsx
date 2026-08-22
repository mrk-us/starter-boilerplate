import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WelcomeToProEmailProps {
  name: string;
}

export default function WelcomeToProEmail({ name }: WelcomeToProEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Pro! You now have access to all premium features
      </Preview>
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
                success: "#22c55e",
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
                🎉 Welcome to Pro!
              </Heading>
              <Text className="text-[16px] text-secondary">Hi {name},</Text>
              <Text className="text-[16px] text-secondary">
                Thank you for upgrading to Pro! You now have access to all
                features.
              </Text>
            </Section>

            <Section className="mt-4 rounded-2xl border border-border bg-card p-4">
              <Text className="m-0 font-medium text-[16px] text-primary">
                What's included in Pro:
              </Text>
              <Text className="m-0 mt-2 text-[14px] text-secondary">
                ✓ Unlimited access to all features
              </Text>
              <Text className="m-0 mt-1 text-[14px] text-secondary">
                ✓ Priority support
              </Text>
              <Text className="m-0 mt-1 text-[14px] text-secondary">
                ✓ Advanced analytics
              </Text>
              <Text className="m-0 mt-1 text-[14px] text-secondary">
                ✓ Early access to new features
              </Text>
            </Section>

            <Section className="mt-8">
              <Text className="m-0 text-[16px] text-secondary">
                If you have any questions, don't hesitate to reach out to our
                support team.
              </Text>
              <Text className="m-0 mt-4 text-[16px] text-secondary">
                Best regards,
              </Text>
              <Text className="m-0 text-[16px] text-secondary">The Team</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
