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

export type PurchaseTableEntry = {
  tableCode: string;
  ticketNumber: string;
};

export function PurchaseEmail({
  logoCid,
  tables,
}: {
  logoCid: string;
  tables: PurchaseTableEntry[];
}) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for your purchase — your NO SIGNAL table is confirmed.</Preview>
      <Body style={{ backgroundColor: "#000000", fontFamily: "sans-serif", margin: 0 }}>
        <Container
          style={{
            backgroundColor: "#000000",
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
              fontSize: 22,
              letterSpacing: 3,
              fontWeight: 700,
              margin: 0,
            }}
          >
            THANK YOU FOR YOUR PURCHASE
          </Heading>

          <Text style={{ color: "#d4d4d4", fontSize: 14, lineHeight: "22px", marginTop: 20 }}>
            Thank you for purchasing a table for <strong>NO SIGNAL</strong>.
          </Text>

          {tables.map((t, i) => (
            <Section key={t.ticketNumber} style={{ marginTop: i === 0 ? 32 : 40 }}>
              <Text
                style={{
                  color: "#a3a3a3",
                  fontSize: 11,
                  letterSpacing: 3,
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                Table Code
              </Text>
              <Text
                style={{
                  color: "#f97316",
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: 6,
                  margin: "6px 0 0",
                }}
              >
                {t.tableCode}
              </Text>

              <Text
                style={{
                  color: "#a3a3a3",
                  fontSize: 11,
                  letterSpacing: 3,
                  margin: "24px 0 0",
                  textTransform: "uppercase",
                }}
              >
                Status
              </Text>
              <Text
                style={{
                  color: "#22c55e",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 2,
                  margin: "6px 0 0",
                }}
              >
                CONFIRMED
              </Text>
            </Section>
          ))}

          <Text
            style={{
              color: "#a3a3a3",
              fontSize: 12,
              lineHeight: "20px",
              marginTop: 28,
            }}
          >
            Present your Table Code for verification at the event.
            <br />
            The exact location will drop 1 day before the event.
          </Text>

          <Hr style={{ borderColor: "#262626", margin: "32px 0 20px" }} />

          <Text style={{ color: "#737373", fontSize: 11, margin: 0 }}>
            Need help? Contact the NO SIGNAL team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
