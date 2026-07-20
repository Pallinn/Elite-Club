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
  qrCid,
  ticketNumber,
}: {
  logoCid: string;
  qrCid: string;
  ticketNumber: string;
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
              Entry QR Code
            </Text>
            <Img
              src={qrCid}
              alt={`Entry QR ${ticketNumber}`}
              width={200}
              style={{
                margin: "0 auto",
                backgroundColor: "#ffffff",
              }}
            />
            <Text style={{ color: "#737373", fontSize: 11, margin: "8px 0 0" }}>
              {ticketNumber}
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
            Present this QR Code at the entrance for check-in.
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
