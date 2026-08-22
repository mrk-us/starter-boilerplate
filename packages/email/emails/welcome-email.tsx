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

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>Here's some useful links to get you started</Preview>
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
            {/* <Section className="mt-4">
							<Img alt="Framer" className="mx-0 my-0" height="50" src="https://d3b9kr64nievew.cloudfront.net/cm1rki22e0174akkvdbsg2yzi/cm1rkyfp8000l1sulf3ko6p6v.png" width="50" />
						</Section> */}

            <Section className="mt-0">
              <Heading className="mx-0 mb-8 p-0 font-medium text-[20px] text-primary">
                Welcome {name}
              </Heading>
              <Text className="text-[16px] text-secondary">
                Here are some useful links to get you started
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
