import { View, Text, TextInput, StyleSheet } from "react-native";
import type { ContactData } from "../types";
import { colors, spacing, radius } from "../theme";

type Props = { contact: ContactData; onChange: (next: ContactData) => void };

const FIELDS: { key: keyof ContactData; label: string; placeholder: string }[] = [
  { key: "tenantName", label: "Dein Name", placeholder: "Max Mustermann" },
  { key: "tenantAddress", label: "Deine Adresse", placeholder: "Musterstraße 1, 12345 Musterstadt" },
  { key: "landlordName", label: "Vermieter", placeholder: "Vermietung Beispiel GmbH" },
  { key: "landlordAddress", label: "Adresse Vermieter", placeholder: "Hauptstraße 99, 12345 Musterstadt" },
  { key: "contractNumber", label: "Vertragsnummer (optional)", placeholder: "MV-2024-0815" },
  { key: "billingPeriod", label: "Abrechnungszeitraum", placeholder: "01.01.2024 - 31.12.2024" },
];

export function ContactForm({ contact, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {FIELDS.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={contact[f.key] ?? ""}
            onChangeText={(t) => onChange({ ...contact, [f.key]: t })}
            placeholder={f.placeholder}
            placeholderTextColor={colors.border}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
});
