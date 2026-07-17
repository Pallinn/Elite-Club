import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function ResetPasswordEmail({
  resetUrl,
  name,
}: {
  resetUrl: string;
  name?: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reset your No Signal password</Preview>
      <Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#171717",
            borderRadius: 12,
            padding: 32,
            margin: "40px auto",
            maxWidth: 480,
          }}
        >
          <Heading style={{ color: "#ffffff", fontSize: 20 }}>
            Reset your password
          </Heading>
          <Text style={{ color: "#d4d4d4", fontSize: 14 }}>
            Hi{name ? ` ${name}` : ""}, we received a request to reset your No
            Signal account password. This link expires in 60 minutes.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: "#737373", fontSize: 12 }}>
            If you didn&apos;t request this, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
