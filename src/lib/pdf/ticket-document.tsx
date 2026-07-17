import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    backgroundColor: "#0a0a0a",
    color: "#ffffff",
  },
  eventName: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 10, color: "#a3a3a3", marginBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketNumber: { fontSize: 14, marginBottom: 4 },
  zoneLabel: { fontSize: 12, color: "#d4d4d4" },
  qr: { width: 140, height: 140 },
});

export function TicketDocument({
  eventName,
  venueName,
  startAt,
  ticketNumber,
  zoneLabel,
  qrDataUrl,
}: {
  eventName: string;
  venueName: string;
  startAt: string;
  ticketNumber: string;
  zoneLabel: string;
  qrDataUrl: string;
}) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.eventName}>{eventName}</Text>
        <Text style={styles.meta}>
          {venueName} - {startAt}
        </Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.ticketNumber}>{ticketNumber}</Text>
            <Text style={styles.zoneLabel}>{zoneLabel}</Text>
          </View>
          <Image src={qrDataUrl} style={styles.qr} />
        </View>
      </Page>
    </Document>
  );
}
