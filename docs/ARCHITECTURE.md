# Architektur-Dokumentation — Nebenkostencheck

**Stand:** 2026-05-28

---

## Überblick

Nebenkostencheck ist eine Single-Page-App: Der Nutzer lädt ein Dokument hoch, das direkt an die Gemini-API geschickt wird. Die KI analysiert es im selben Request und gibt strukturiertes JSON zurück. Es gibt keine Datenbank und keinen persistenten Zustand zwischen Sessions.

```
Browser
  │
  ├─ Upload (base64-kodiertes PDF/Bild)
  │      │
  │      ▼
  │  POST /api/analyze
  │      │
  │      ├─ Gemini 2.5 Flash (Dokument + System-Prompt)
  │      │      │
  │      │      └─ JSON: AnalysisResult
  │      │
  │      └─ Zurück an Browser → ResultView
  │
  └─ Brief-Anfrage (optional)
         │
         ▼
     POST /api/generate-letter
         │
         ├─ Gemini 2.5 Flash (Fehler + Kontaktdaten + Brief-Prompt)
         │
         └─ Plaintext-Brief → LetterModal
```

---

## Datenfluss im Detail

### 1. Upload (`UploadZone → page.tsx → /api/analyze`)

Der Browser konvertiert die Datei mit `FileReader` in Base64 und sendet:

```json
{
  "base64": "<base64-kodierter Dateiinhalt>",
  "mediaType": "application/pdf",
  "fileName": "abrechnung-2024.pdf"
}
```

Die Route validiert den MIME-Type (nur `application/pdf` und `image/*`) und leitet das Dokument als `inlineData` an Gemini weiter. Gemini kann sowohl PDF als auch gängige Bildformate nativ lesen.

### 2. KI-Analyse (`/api/analyze/route.ts`)

Die Route sendet Dokument und System-Prompt in einem einzigen API-Call. Kein zweistufiger Ansatz.

**SCHRITT 0 — Dokumentprüfung (Pflicht):** Bevor die eigentliche Analyse startet, prüft die KI ob das Dokument überhaupt eine Nebenkostenabrechnung ist. Bei NEIN gibt sie ausschließlich `{"notAStatement": true, ...}` zurück. Das Frontend zeigt dann eine Info-Box statt der Ergebnisansicht.

**Antwortformat:** Die KI gibt ausschließlich valides JSON zurück (ohne Markdown-Umrahmung). Falls Gemini dennoch Code-Blöcke einfügt, werden diese per Regex entfernt (`/```json\n?|```/g`).

### 3. Ergebnisanzeige (`ResultView`)

Gefundene Fehler werden in zwei Gruppen aufgeteilt:
- **Sofort angreifbar** (`category: "direct"`) — direkt widerspruchsfähig
- **Belegeinsicht erforderlich** (`category: "needs_review"`) — erst nach Akteneinsicht angreifbar

Pro Fehler gibt es drei Vertrauensstufen (`confidence`): `sicher`, `wahrscheinlich`, `unsicher`.

### 4. Briefgenerator (`LetterModal → /api/generate-letter`)

Wenn der Nutzer einen Brief erstellt, sendet das Frontend:
- Den Brieftyp (`"objection"` oder `"document_review"`)
- Die relevanten Fehler-Items (nur die passende Kategorie)
- Kontaktdaten (Mieter, Vermieter, Vertragsnummer, Abrechnungszeitraum)

Die Route baut daraus einen detaillierten Prompt und gibt einen fertig formatierten Brieftext zurück (kein Markdown, direkt kopierbar).

---

## KI-Prompt-Design

### Anti-Halluzinations-Regeln

Das größte Risiko bei juristischen KI-Analysen ist das Erfinden von Fehlern. Der System-Prompt enthält daher strenge Regeln:

1. **Nur dokumentierte Zahlen** — jede genannte Zahl muss wörtlich im Dokument stehen
2. **Kein Konstruieren von Diskrepanzen** — Zwischensummen oder verschiedene Darstellungen desselben Werts werden nicht als Fehler interpretiert
3. **Zitierbarer Beleg Pflicht** — das `evidence`-Feld muss ein wörtliches Zitat oder eine konkrete Dokumentstelle enthalten
4. **Finaler Selbst-Check** — die KI geht vor der Antwort jeden Fehler durch und prüft nochmal ob ein Beleg vorhanden ist

Philosophie: Lieber einen echten Fehler übersehen als einen nicht-existenten Fehler melden.

### Fehlerregeln (Stand 2026-05-28)

#### Sofort angreifbar — sicher

| Rechtsgrundlage | Verstoß | Folge |
|---|---|---|
| § 9 Abs. 2 HeizkV | Warmwasser-Wärmemenge per Formel berechnet statt Wärmemengenzähler (Pflicht seit 31.12.2013) | 15 % Kürzungsrecht (§ 12 HeizkV) |
| § 7 Abs. 1 HeizkV | Heizkosten zu 100 % nach Wohnfläche (0 % Verbrauchsanteil, wörtlich belegt) | 15 % Kürzungsrecht (§ 12 HeizkV) |
| § 1 Abs. 2 BetrKV | Positionstitel enthält wörtlich "Reparatur", "Instandhaltung" oder "Instandsetzung" | Position streichen |
| § 259 BGB | Gesamtkosten des Gebäudes fehlen vollständig (keine einzige Gesamtkostenspalte/-zeile) | Abrechnung formell unwirksam |
| § 556 Abs. 3 BGB | Abrechnungsfrist überschritten (> 12 Monate nach Abrechnungsjahresende) | Nachforderung ausgeschlossen |
| BGH VIII ZR 78/12 | Pauschale Vorauszahlungserhöhungen ohne Einzelabrechnung | Erhöhung unwirksam |

#### Sofort angreifbar — wahrscheinlich

| Rechtsgrundlage | Verstoß |
|---|---|
| § 1 Abs. 2 BetrKV | Positionstitel enthält wörtlich "Verwaltungsgebühr", "Hausverwaltungskosten" oder "Verwalterhonorar" |
| § 25a NMV | Umlageausfallwagnis bei nicht öffentlich gefördertem Wohnraum |

#### Belegeinsicht erforderlich — wahrscheinlich

- Auffällig hohe Versicherungsbeiträge (Elementarversicherung nicht umlagefähig)
- Hauswartleistungen ohne Aufschlüsselung (Verwaltungsanteil nicht umlagefähig)
- Leerstandskosten: Flächenschlüssel weicht deutlich von Mieterfläche ab (BGH VIII ZR 167/03)

#### Belegeinsicht erforderlich — unsicher

- Sperrmüll (umlagefähig nur wenn regelmäßig anfallend)
- Rauchwarnmelder: Wartung ja, Anschaffung/Miete nein
- Verbrauchserfassung: Ablesung ja, Geräte-Anschaffung nein
- Auffällige Kostensteigerungen zum Vorjahr

---

## TypeScript-Typen

```typescript
// Zwei Klassifikationen pro Fehler:
type ErrorCategory = "direct" | "needs_review";   // Vorgehen für den Mieter
type Confidence = "sicher" | "wahrscheinlich" | "unsicher";  // Erfolgsaussicht

interface ErrorItem {
  title: string;
  description: string;
  confidence: Confidence;
  category: ErrorCategory;
  potentialEur?: number | null;    // Geschätztes Erstattungspotenzial in €
  legalBasis?: string | null;      // Rechtsgrundlage (§ X BetrKV etc.)
  actionText?: string | null;      // Handlungsempfehlung für den Mieter
  evidence?: string | null;        // Wörtliches Zitat als Beleg aus dem Dokument
}

interface AnalysisResult {
  notAStatement?: boolean;          // true = kein Nebenkostenabrechnung erkannt
  summary: string;
  errors: ErrorItem[];
  totalPotentialEur?: number | null;
  directPotentialEur?: number | null;
  reviewPotentialEur?: number | null;
  totalPotentialLabel?: string | null;  // "hoch/mittel/niedrig" wenn kein €-Betrag
  contactData?: ContactData;
}
```

---

## Error-Handling

Beide API-Routen übersetzen technische Fehler in deutsche Klartexte:

| Fehlerfall | Deutsche Meldung |
|---|---|
| Gemini 503 / "high demand" | "Die KI ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen." |
| Netzwerkfehler / Timeout | "Verbindung unterbrochen. Bitte erneut versuchen." |
| JSON-Parse-Fehler (Gemini-Antwort kein JSON) | "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." |
| Sonstige Fehler | "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen." |

Das Frontend fängt zusätzlich Fälle ab, in denen Vercel selbst (nicht die Route) mit einer HTML-Fehlerseite antwortet (z.B. 504 Timeout bei Vercel Hobby Plan, 10s Limit). In diesem Fall schlägt `response.json()` fehl und wird durch eine generische deutsche Meldung ersetzt.

---

## Bekannte Einschränkungen

| Einschränkung | Details |
|---|---|
| Vercel Hobby Timeout | 10 Sekunden pro Serverless Function. Große Dokumente oder Gemini-Überlastung können Timeouts auslösen. Workaround: Nutzer bekommt deutsche Fehlermeldung statt HTML. Langfristig: Vercel Pro (60s). |
| Gemini-Auslastung | Die Gemini-API kann bei hoher Last 503 zurückgeben. Transient, kein Bug. |
| Keine Datenpersistenz | Jeder Upload ist eine neue, unabhängige Analyse. Keine History, kein Account. |
| Keine automatischen Tests | TypeScript-Check (`npx tsc --noEmit`) und Build (`npm run build`) als Verifikation. |

---

## Geplante Features (nicht im MVP)

- Anmeldung / Nutzeraccounts
- Zahlungsfunktion / Freemium-Modell (z.B. Brief-Download erst nach Bezahlung)
- Analyse-History
- Retry-Logik bei 503-Fehlern
