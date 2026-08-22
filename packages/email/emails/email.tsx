import { Body, Button, Head, Html, Tailwind } from "@react-email/components";

export default function Email() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body>
          <Button>Click me</Button>
        </Body>
      </Html>
    </Tailwind>
  );
}
