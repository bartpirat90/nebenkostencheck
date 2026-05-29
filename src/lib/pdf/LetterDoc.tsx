import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 56, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica", color: "#111" },
});

export function LetterDoc({ letter }: { letter: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View>
          {letter.split("\n").map((line, i) => (
            <Text key={i}>{line || " "}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
