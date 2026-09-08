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
  // Kein focus:outline-none: der sichtbare 2-px-Ring in Akzentfarbe kommt global
  // aus globals.css (:focus-visible). Ein eigener ring-1 wäre dünner gewesen und
  // hätte die Outline unterdrückt - auch bei Tastaturfokus.
  const baseClass = `
    w-full min-h-11 px-3 py-2.5 rounded-lg border border-paper-line-control bg-doc
    text-sm text-fg placeholder:text-faint
    focus:border-accent
  `;

  return (
    <label className="block">
      {/* Label über dem Feld statt Platzhalter-Beschriftung: bleibt sichtbar,
          sobald getippt wird (WCAG 3.3.2). */}
      <span className="text-sm text-muted block mb-1.5">{label}</span>
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
