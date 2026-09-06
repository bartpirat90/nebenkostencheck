"use client";

import { useTranslations } from "next-intl";
import { ContactData } from "@/types";

interface Props {
  contact: ContactData;
  onChange: (contact: ContactData) => void;
}

export default function ContactForm({ contact, onChange }: Props) {
  const t = useTranslations("contact");
  const update = (field: keyof ContactData, value: string) => {
    onChange({ ...contact, [field]: value || null });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("intro")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={t("tenantName")}
          value={contact.tenantName || ""}
          onChange={(v) => update("tenantName", v)}
          placeholder="Max Mustermann"
        />
        <Field
          label={t("landlordName")}
          value={contact.landlordName || ""}
          onChange={(v) => update("landlordName", v)}
          placeholder="Muster Hausverwaltung GmbH"
        />
      </div>

      <Field
        label={t("tenantAddress")}
        value={contact.tenantAddress || ""}
        onChange={(v) => update("tenantAddress", v)}
        placeholder="Musterstraße 1, 12345 Stadt"
        multiline
      />

      <Field
        label={t("landlordAddress")}
        value={contact.landlordAddress || ""}
        onChange={(v) => update("landlordAddress", v)}
        placeholder="Verwaltungsweg 5, 12345 Musterstadt"
        multiline
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={t("contractNumber")}
          value={contact.contractNumber || ""}
          onChange={(v) => update("contractNumber", v)}
          placeholder="1234567890"
        />
        <Field
          label={t("billingPeriod")}
          value={contact.billingPeriod || ""}
          onChange={(v) => update("billingPeriod", v)}
          placeholder="01.01.2024 - 31.12.2024"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseClass = `
    w-full px-3 py-2 rounded-lg border border-line-strong bg-ink
    text-sm text-fg placeholder:text-faint
    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
  `;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted block mb-1">{label}</span>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </label>
  );
}
