"use client";

import { ContactData } from "@/types";

interface Props {
  contact: ContactData;
  onChange: (contact: ContactData) => void;
}

export default function ContactForm({ contact, onChange }: Props) {
  const update = (field: keyof ContactData, value: string) => {
    onChange({ ...contact, [field]: value || null });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748B]">
        Bitte prüfe die automatisch erkannten Daten und korrigiere sie bei Bedarf.
        Sie werden für den Brief verwendet.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Dein Name"
          value={contact.tenantName || ""}
          onChange={(v) => update("tenantName", v)}
          placeholder="Max Mustermann"
        />
        <Field
          label="Vermieter / Verwalter"
          value={contact.landlordName || ""}
          onChange={(v) => update("landlordName", v)}
          placeholder="Vonovia Kundenservice GmbH"
        />
      </div>

      <Field
        label="Deine Adresse"
        value={contact.tenantAddress || ""}
        onChange={(v) => update("tenantAddress", v)}
        placeholder="Musterstraße 1, 12345 Stadt"
        multiline
      />

      <Field
        label="Adresse Vermieter / Verwalter"
        value={contact.landlordAddress || ""}
        onChange={(v) => update("landlordAddress", v)}
        placeholder="Universitätsstr. 133, 44803 Bochum"
        multiline
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Vertragsnummer"
          value={contact.contractNumber || ""}
          onChange={(v) => update("contractNumber", v)}
          placeholder="1234567890"
        />
        <Field
          label="Abrechnungszeitraum"
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
    w-full px-3 py-2 rounded-lg border border-[#334155] bg-[#0F172A]
    text-sm text-[#F1F5F9] placeholder:text-[#475569]
    focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]
  `;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#94A3B8] block mb-1">{label}</span>
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
