import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Sauberer formaler Geschäftsbrief in Anlehnung an DIN 5008.
// Der Brieftext enthält bereits Briefkopf/Anrede/Betreff (von der KI erzeugt);
// hier geht es nur um die typografische Aufbereitung – bewusst neutral, ohne
// Nebenkostencheck-Branding (es ist das Schreiben des Mieters an den Vermieter).
const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingLeft: 70, // ~25 mm linker Rand (DIN)
    paddingRight: 50,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
    color: "#1A1A1A",
  },
  betreff: {
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 6,
  },
  blank: { height: 8 },
  // DIN-5008 Falt- und Lochmarken am linken Blattrand
  foldMark: {
    position: "absolute",
    left: 14,
    width: 12,
    borderTopWidth: 0.6,
    borderTopColor: "#9A9A9A",
  },
  holeMark: {
    position: "absolute",
    left: 10,
    width: 18,
    borderTopWidth: 0.6,
    borderTopColor: "#9A9A9A",
  },
});

export function LetterDoc({ letter }: { letter: string }) {
  const lines = letter.split("\n");
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Faltmarke 1 (105 mm), Lochmarke (148,5 mm), Faltmarke 2 (210 mm) */}
        <View style={[s.foldMark, { top: 297 }]} fixed />
        <View style={[s.holeMark, { top: 419 }]} fixed />
        <View style={[s.foldMark, { top: 595 }]} fixed />

        <View>
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed === "") return <View key={i} style={s.blank} />;
            if (/^betreff/i.test(trimmed)) {
              return (
                <Text key={i} style={s.betreff}>
                  {line}
                </Text>
              );
            }
            return <Text key={i}>{line}</Text>;
          })}
        </View>
      </Page>
    </Document>
  );
}
