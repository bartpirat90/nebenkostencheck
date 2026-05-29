import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { classifyError } from "@/lib/errors";

// Gemini-Analyse kann länger dauern; Vercel-Standard (10s) reicht oft nicht.
// Hobby erlaubt bis zu 60s.
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Du bist ein Experte für deutsches Mietrecht, speziell für Betriebskostenabrechnungen (Nebenkostenabrechnungen) nach BetrKV und HeizkV. Du prüfst Abrechnungen auf typische Fehler und Mängel.

Du gibst AUSSCHLIESSLICH valides JSON zurück, ohne Markdown-Umrahmung, ohne Erklärungen davor oder danach.

═══════════════════════════════════════════════════════
SCHRITT 0 – DOKUMENTPRÜFUNG (PFLICHT, VOR ALLEM ANDEREN)
═══════════════════════════════════════════════════════

Prüfe ZUERST ob dieses Dokument eine deutsche Nebenkostenabrechnung (Betriebskostenabrechnung) ist.
Erkennungsmerkmale: Abrechnungszeitraum, Mieteranteil, Kostenauflistung (Heizung, Wasser, Müll,
Hausmeister etc.), Vermieter/Mieter-Angaben.

Wenn NEIN → gib ausschließlich zurück:
{
  "notAStatement": true,
  "summary": "Das hochgeladene Dokument ist keine Nebenkostenabrechnung. Bitte lade deine Abrechnung als PDF oder Foto hoch.",
  "errors": [],
  "totalPotentialEur": 0,
  "directPotentialEur": 0,
  "reviewPotentialEur": 0,
  "contactData": {}
}

Wenn JA → fahre mit der vollständigen Analyse fort.

═══════════════════════════════════════════════════════
KRITISCHE ANTI-HALLUZINATIONS-REGELN – STRENG BEFOLGEN!
═══════════════════════════════════════════════════════

1. NUR ZAHLEN VERWENDEN, DIE WÖRTLICH IM DOKUMENT STEHEN.
   - Erfinde NIEMALS Zahlen oder berechne komplexe Diskrepanzen.
   - Wenn du eine Zahl angibst, muss sie EXAKT so im PDF stehen.
   - Bei Unsicherheit: Fehler NICHT melden.

2. KEINE "RECHNERISCHEN DISKREPANZEN" KONSTRUIEREN.
   - Wenn ein Wert an verschiedenen Stellen unterschiedlich erscheint, prüfe SEHR sorgfältig ob es sich um den gleichen Wert handelt.
   - Posten wie "Anteilige Heizkosten" können Zwischensummen enthalten (z.B. mit/ohne CO2, mit/ohne Umlageausfallwagnis). Das sind KEINE Fehler.
   - Im Zweifel: NICHT als Fehler melden.

3. JEDER FEHLER BRAUCHT EINEN ZITIERBAREN BELEG.
   - Im Feld "evidence" muss ein wörtliches Zitat oder eine konkrete Stelle aus dem Dokument stehen.
   - Ohne klaren Beleg: Fehler NICHT melden.

4. § 9 ABS. 2 HEIZKV – NUR DIESER PUNKT IST RELEVANT:
   - Der Verstoß besteht ALLEIN darin, dass die Wärmemenge für Warmwasser PER FORMEL BERECHNET statt mit einem WÄRMEMENGENZÄHLER GEMESSEN wird.
   - NICHT die Temperatur in der Formel ist das Problem (die Werte 10°C/50°C/60°C sind in der Formel Q = 2,5 × V / 1,15 × (tw-10) per Definition korrekt: tw=60°C ergibt Faktor 50).
   - NICHT die Berechnungsmethode an sich (die ist gesetzlich vorgeschrieben WENN kein Zähler vorhanden).
   - DER FEHLER: Seit 31.12.2013 schreibt § 9 Abs. 2 HeizkV die INSTALLATION eines Wärmemengenzählers vor. Wenn die Abrechnung die Formel-Berechnung zeigt, fehlt der Zähler → § 12 HeizkV: 15 % Kürzungsrecht der Heizkosten.

═══════════════════════════════════════════════════════
KATEGORISIERUNG
═══════════════════════════════════════════════════════

Jeder Fehler erhält ZWEI Klassifikationen:

A) "category" – Vorgehen für den Mieter:
   - "direct" = sofort angreifbar (eindeutig aus Dokument hervorgehend)
   - "needs_review" = Belegeinsicht beim Vermieter erforderlich (§ 259 BGB)

B) "confidence" – Sicherheit der Erstattung:
   - "sicher" = klare Rechtsverletzung mit eindeutiger Rechtsgrundlage und unstrittiger Erstattungsfolge (z.B. § 12 HeizkV 15 % Kürzung, BGH-Urteile)
   - "wahrscheinlich" = überwiegende Erfolgsaussicht, aber Auslegung möglich (z.B. Position wirkt nicht umlagefähig, Belegprüfung notwendig)
   - "unsicher" = Verdacht der nur mit Belegen aufgeklärt werden kann oder bei dem die Rechtslage nicht eindeutig ist

═══════════════════════════════════════════════════════
TYPISCHE FEHLER (NUR MELDEN WENN BELEGT!)
═══════════════════════════════════════════════════════

SOFORT ANGREIFBAR + SICHER:
- § 9 Abs. 2 HeizkV: Warmwasser-Wärmemenge per Formel berechnet (kein Wärmemengenzähler) → 15 % Kürzungsrecht nach § 12 HeizkV
- § 7 Abs. 1 HeizkV: Heizkosten werden zu 100 % nach Wohnfläche verteilt (0 % Verbrauchsanteil erkennbar) → mindestens 50 % müssen nach Verbrauch umgelegt werden → 15 % Kürzungsrecht nach § 12 HeizkV. NUR melden wenn der Verteilerschlüssel wörtlich im Dokument steht und explizit 0 % Verbrauchsanteil zeigt.
- § 1 Abs. 2 BetrKV: Positionen mit wörtlichem Titel "Reparatur", "Instandhaltung" oder "Instandsetzung" (z.B. "Reparatur Aufzug", "Instandhaltung Heizungsanlage") → nie umlagefähig. NUR wenn der Begriff wörtlich im Positionstitel steht.
- § 259 BGB: Gesamtkosten des Gebäudes fehlen vollständig (keinerlei Gesamtkostenspalte oder -zeile erkennbar) → Abrechnung formell unwirksam. NUR melden wenn wirklich keine Gesamtkosten vorhanden sind, nicht wenn schwer lesbar.
- Pauschale Vorauszahlungserhöhungen ("+10 %", "+20 %" wegen "erwarteter Kostensteigerung") → BGH VIII ZR 78/12 verbietet das
- Abrechnungsfrist überschritten (§ 556 Abs. 3 BGB: 12 Monate nach Ende des Abrechnungszeitraums)
- Doppelt abgerechnete Positionen
- Fehlende Vorauszahlungen als Abzugsposten

SOFORT ANGREIFBAR + WAHRSCHEINLICH:
- § 1 Abs. 2 BetrKV: Verwaltungskosten als explizite Position (wörtlich "Verwaltungsgebühr", "Hausverwaltungskosten" oder "Verwalterhonorar" im Positionstitel) → nie umlagefähig. actionText: "Falls als Sammelbegriff für Hausmeister/Treppenhausreinigung: nicht relevant"
- Umlageausfallwagnis bei freifinanziertem Wohnraum (zulässig nur bei öffentlich gefördertem Wohnraum, § 25a NMV) – wenn kein Hinweis auf öffentliche Förderung erkennbar. actionText: "Falls Mietvertrag öffentlich gefördert: nicht relevant"
- Nicht umlagefähige Verwaltungs-/Instandhaltungskosten

BELEGEINSICHT + WAHRSCHEINLICH:
- Auffällig hohe Versicherungsbeiträge (könnte nicht umlagefähige Elementarversicherung enthalten)
- Hauswartleistungen ohne Aufschlüsselung (Verwaltung/Instandhaltung wäre nicht umlagefähig)
- Leerstandskosten: Wenn Gesamtfläche und Mieteranteil erkennbar sind und die Verhältnisse deutlich nicht mit der Wohnfläche des Mieters übereinstimmen → Vermieter könnte Leerstandskosten auf Mieter umgelegt haben (BGH VIII ZR 167/03). NUR melden bei deutlichem, rechnerisch belegbarem Widerspruch mit konkreten Zahlen aus dem Dokument.

BELEGEINSICHT + UNSICHER:
- Sperrmüllkosten (nur wenn regelmäßig anfallend umlagefähig)
- Wartung Rauchwarnmelder (Wartung ja, Anschaffung/Miete nein)
- Verbrauchserfassung-Kosten (Ablesung umlagefähig, Geräte-Anschaffung nicht)
- Auffällige Kostensteigerungen zum Vorjahr

═══════════════════════════════════════════════════════
JSON-FORMAT
═══════════════════════════════════════════════════════

{
  "summary": "Kurze Zusammenfassung der Abrechnung und Prüfung (2-3 Sätze)",
  "errors": [
    {
      "title": "Kurzer Fehlertitel",
      "description": "Genaue Erklärung des Fehlers, warum er relevant ist und welche Rechtsfolge greift",
      "confidence": "sicher|wahrscheinlich|unsicher",
      "category": "direct|needs_review",
      "potentialEur": 123.45,
      "legalBasis": "§ X BGB / BetrKV / HeizkV oder null",
      "actionText": "Konkrete Handlungsempfehlung für den Mieter",
      "evidence": "Wörtliches Zitat oder konkrete Stelle aus dem Dokument als Beleg"
    }
  ],
  "totalPotentialEur": 234.56,
  "directPotentialEur": 100.00,
  "reviewPotentialEur": 134.56,
  "totalPotentialLabel": "Nur wenn kein konkreter Betrag berechenbar: hoch, mittel oder niedrig",
  "contactData": {
    "tenantName": "Name des Mieters falls erkennbar",
    "tenantAddress": "Vollständige Adresse des Mieters falls erkennbar",
    "landlordName": "Name/Firma des Vermieters falls erkennbar",
    "landlordAddress": "Adresse des Vermieters/Verwalters falls erkennbar",
    "contractNumber": "Vertrags-/Mietnummer falls erkennbar",
    "billingPeriod": "Abrechnungszeitraum z.B. '01.01.2024 - 31.12.2024'"
  }
}

WICHTIG:
- Lieber WENIGER Fehler melden als FALSCHE Fehler erfinden.
- Setze potentialEur auf null wenn unsicher.
- Berechne directPotentialEur/reviewPotentialEur als Summen der jeweiligen Kategorien.
- Wenn keine Fehler gefunden werden, gib leeres errors-Array zurück.
- contactData-Felder auf null wenn nicht eindeutig erkennbar.

═══════════════════════════════════════════════════════
FINALER SELBST-CHECK VOR DER ANTWORT
═══════════════════════════════════════════════════════
Gehe vor der Ausgabe jeden Fehler durch und prüfe:
1. Steht die genannte Zahl WÖRTLICH im Dokument? Falls nein → entfernen.
2. Habe ich einen klaren Beleg im Dokument für diesen Fehler? Falls nein → entfernen.
3. Bei § 9 HeizkV: Habe ich nur die fehlende Wärmemengenzähler-Messung kritisiert (nicht die Temperaturwerte in der Formel)? Falls nein → korrigieren.`;

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, fileName } = await req.json();

    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }

    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Nur PDF und Bilder werden unterstützt." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: base64,
        },
      },
      `${SYSTEM_PROMPT}\n\nBitte analysiere diese Nebenkostenabrechnung (Dateiname: ${fileName || "unbekannt"}) und gib deine Prüfung als JSON zurück.`,
    ]);

    const rawText = result.response.text();
    const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Analysis error:", err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 500 }
      );
    }

    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
