import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function JoinEmail({
  logoCid,
  tableNumber,
  tableCode,
}: {
  logoCid: string;
  tableNumber: string;
  tableCode: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re in — welcome to NO SIGNAL.</Preview>
      <Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif", margin: 0 }}>
        <Container
          style={{
            backgroundColor: "#111111",
            borderRadius: 12,
            padding: 40,
            margin: "40px auto",
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          <Img
            src={logoCid}
            alt="ELITE"
            width={110}
            style={{ margin: "0 auto 32px" }}
          />

          <Heading
            style={{
              color: "#ffffff",
              fontSize: 26,
              letterSpacing: 4,
              fontWeight: 700,
              margin: 0,
            }}
          >
            YOU&apos;RE IN
          </Heading>

          <Text style={{ color: "#d4d4d4", fontSize: 14, lineHeight: "22px", marginTop: 20 }}>
            Welcome to <strong>NO SIGNAL</strong>.
            <br />
            Your seat has been successfully assigned.
          </Text>

          <Section style={{ marginTop: 32 }}>
            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 11,
                letterSpacing: 3,
                margin: "0 0 12px",
                textTransform: "uppercase",
              }}
            >
              Table No.
            </Text>
            <Text
              style={{
                color: "#f97316",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                margin: 0,
              }}
            >
              {tableNumber}
            </Text>

            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 11,
                letterSpacing: 3,
                margin: "24px 0 12px",
                textTransform: "uppercase",
              }}
            >
              Table Code
            </Text>
            <Text
              style={{
                color: "#f97316",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                margin: 0,
              }}
            >
              {tableCode}
            </Text>
          </Section>

          <Text
            style={{
              color: "#a3a3a3",
              fontSize: 12,
              lineHeight: "20px",
              marginTop: 28,
            }}
          >
            The exact location will drop 1 day before the event.
          </Text>

          <Hr style={{ borderColor: "#262626", margin: "32px 0 20px" }} />

          <Text style={{ color: "#737373", fontSize: 11, margin: 0 }}>
            See you at NO SIGNAL.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
