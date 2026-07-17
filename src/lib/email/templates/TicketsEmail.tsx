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

export type TicketEmailItem = {
  ticketNumber: string;
  label: string;
  qrUrl: string;
};

export function TicketsEmail({
  eventName,
  venueName,
  startAt,
  contactName,
  tickets,
  isResend,
}: {
  eventName: string;
  venueName: string;
  startAt: string;
  contactName?: string | null;
  tickets: TicketEmailItem[];
  isResend?: boolean;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        {isResend ? "Your No Signal tickets" : `Payment received — your ${eventName} tickets`}
      </Preview>
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
            {isResend ? "Here are your tickets" : "Payment received"}
          </Heading>
          <Text style={{ color: "#d4d4d4", fontSize: 14 }}>
            Hi{contactName ? ` ${contactName}` : ""}, {isResend ? "here's your e-ticket for" : "you're confirmed for"}{" "}
            <strong>{eventName}</strong> at {venueName} on {startAt}.
          </Text>

          {tickets.map((ticket) => (
            <Section
              key={ticket.ticketNumber}
              style={{
                backgroundColor: "#0a0a0a",
                borderRadius: 8,
                padding: 16,
                margin: "16px 0",
                textAlign: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 14, marginBottom: 4 }}>
                {ticket.label}
              </Text>
              <Text style={{ color: "#737373", fontSize: 12, marginTop: 0 }}>
                {ticket.ticketNumber}
              </Text>
              <Img
                src={ticket.qrUrl}
                width={160}
                height={160}
                alt={ticket.ticketNumber}
                style={{ margin: "8px auto", borderRadius: 4, backgroundColor: "#ffffff", padding: 8 }}
              />
            </Section>
          ))}

          <Hr style={{ borderColor: "#262626" }} />
          <Text style={{ color: "#737373", fontSize: 12 }}>
            Show this QR code at the door for check-in. You can also view and download
            your tickets any time from your No Signal account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
