# Design-Spezifikation: Analyse-Verbesserung, Dokumentvalidierung & Error-UX

**Datum:** 2026-05-28  
**Status:** Genehmigt  
**Scope:** Gemini-Prompt-Erweiterung, Dokumentvalidierung, nutzerfreundliche Fehlermeldungen

---

## Ziel

Die KI-Analyse soll fokussierter und zuverlässiger werden:
- Falsche Dokumente werden erkannt und freundlich abgewiesen
- Der Fehlerkatalog wird um gut belegbare Rechtsverstöße erweitert
- API-Fehlermeldungen erscheinen auf Deutsch, ohne technische Details

---

## Ansatz: Einzel-Prompt (Ansatz A)

Alle Verbesserungen fließen in den bestehenden Gemini-Prompt (`/api/analyze/route.ts`). Ein einziger API-Aufruf pro Upload — keine zweite Validierungs-Anfrage.

---

## Abschnitt 1: Dokumentvalidierung

### Prompt-Erweiterung

Am Anfang des `SYSTEM_PROMPT` wird ein Pflicht-Check eingefügt, der vor jeder anderen Analyse ausgeführt wird:

```
SCHRITT 0 – DOKUMENTPRÜFUNG (PFLICHT, VOR ALLEM ANDEREN):
Prüfe ob dieses Dokument eine deutsche Nebenkostenabrechnung (Betriebskostenabrechnung) ist.
Erkennungsmerkmale: Abrechnungszeitraum, Mieteranteil, Kostenauflistung (Heizung, Wasser,
Müll, Hausmeister etc.), Vermieter/Mieter-Angaben.

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
```

### Typ-Erweiterung

`AnalysisResult` in `src/types/index.ts` erhält ein optionales Feld:

```ts
notAStatement?: boolean;
```

### Frontend-Verhalten (`page.tsx`)

Nach der Analyse wird `result.notAStatement` geprüft. Wenn `true`:
- Kein `<ResultView>` rendern
- Stattdessen Info-Box anzeigen:

```
⚠️ Kein passendes Dokument erkannt
Das sieht nicht wie eine Nebenkostenabrechnung aus.
Bitte lade deine Abrechnung als PDF oder Foto hoch.
[Andere Datei hochladen]  ← Button löst handleReset() aus
```

Styling: `bg-[#1C1A0E] border-[#92400E]` (Gelb/Warnung), Text `text-[#FCD34D]`, Button im Secondary-Style.

---

## Abschnitt 2: Erweiterter Fehlerkatalog

Der `SYSTEM_PROMPT` erhält folgende neue Einträge in der Sektion „TYPISCHE FEHLER":

### Neu: SOFORT ANGREIFBAR + SICHER

**§ 7 Abs. 1 HeizkV — Verbrauchsanteil Heizkosten unter 50 %**  
Heizkosten müssen zu mindestens 50 % (maximal 70 %) nach Verbrauch verteilt werden. Wenn die Abrechnung zeigt, dass 100 % nach Wohnfläche umgelegt werden (kein Verbrauchsanteil), ist das ein klarer Verstoß. Folge: 15 % Kürzungsrecht nach § 12 HeizkV.  
*Beleg erforderlich: explizite Angabe des Verteilerschlüssels im Dokument.*

**§ 1 Abs. 2 BetrKV — Explizite Instandhaltungs-/Reparaturkosten**  
Positionen, die wörtlich „Reparatur", „Instandhaltung" oder „Instandsetzung" im Titel tragen (z.B. „Reparatur Aufzug", „Instandhaltung Heizungsanlage"), sind nie umlagefähig.  
*Beleg erforderlich: wörtlicher Positionstitel im Dokument.*

**§ 259 BGB — Gesamtkosten fehlen**  
Die Abrechnung muss die Gesamtkosten des Gebäudes ausweisen, nicht nur den Mieteranteil. Fehlen die Gesamtkosten vollständig, ist die Abrechnung formell unwirksam.  
*Beleg erforderlich: kein Gesamtkostenbetrag im Dokument erkennbar. NUR melden wenn keine einzige Spalte/Zeile mit Gesamtkosten vorhanden ist — nicht wenn Gesamtkosten vorhanden aber schwer lesbar sind.*

### Neu: SOFORT ANGREIFBAR + WAHRSCHEINLICH

**§ 1 Abs. 2 BetrKV — Verwaltungskosten als explizite Position**  
Positionen mit wörtlicher Bezeichnung „Verwaltungsgebühr", „Hausverwaltungskosten", „Verwalterhonorar" o.Ä. sind nicht umlagefähig. Nur wenn dieser Begriff wörtlich im Positionstitel steht.  
*Hinweis im actionText: „Falls als Sammelbegriff für Hausmeister/Treppenhausreinigung: nicht relevant"*

### Neu: BELEGEINSICHT + WAHRSCHEINLICH

**Leerstandskosten — Plausibilitätsprüfung Flächenschlüssel**  
Wenn Gesamtfläche und Mieteranteil im Dokument erkennbar sind und die Verhältnisse nicht mit der Wohnfläche des Mieters übereinstimmen, könnte der Vermieter Leerstandskosten auf den Mieter umgelegt haben (unzulässig, BGH VIII ZR 167/03).  
*Nur melden wenn konkrete Zahlen einen deutlichen Widerspruch zeigen.*

### Bestehende Regeln — keine Änderungen

Alle bisherigen Regeln (§ 9 Abs. 2 HeizkV, § 556 Abs. 3 BGB, Pauschale Vorauszahlungserhöhungen, Umlageausfallwagnis, Hauswartkosten, Versicherungsbeiträge, Sperrmüll, Rauchwarnmelder, Verbrauchserfassung) bleiben unverändert.

Die Anti-Halluzinations-Regeln gelten für alle neuen Einträge gleichwertig: kein Befund ohne wörtlichen Beleg im Dokument.

---

## Abschnitt 3: Nutzerfreundliche Fehlermeldungen

### `/api/analyze/route.ts` und `/api/generate-letter/route.ts`

Der `catch`-Block wird erweitert um spezifische Fehlererkennung:

| Bedingung | Deutsche Meldung |
|---|---|
| HTTP 503 / „high demand" / „Service Unavailable" | „Die KI ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen." |
| Netzwerkfehler / Timeout / `fetch failed` | „Verbindung unterbrochen. Bitte erneut versuchen." |
| `SyntaxError` (JSON-Parse) | „Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." (bereits vorhanden in analyze, jetzt auch in generate-letter) |
| Sonstige Fehler | „Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen." |

Erkennung über `message.toLowerCase().includes("503")` bzw. `"service unavailable"` bzw. `"high demand"`.

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/app/api/analyze/route.ts` | Prompt-Erweiterung (Schritt 0 + neue Fehlerregeln), Error-Handling |
| `src/app/api/generate-letter/route.ts` | Error-Handling |
| `src/types/index.ts` | `notAStatement?: boolean` zu `AnalysisResult` |
| `src/app/page.tsx` | `notAStatement`-Anzeige (Info-Box + Reset-Button) |

---

## Explizit Out of Scope

- Retry-Logik (automatisches Wiederholen bei 503) — YAGNI für MVP
- Zweistufige Validierung (separater API-Aufruf)
- Neue Fehler-Kategorien jenseits der oben genannten
- Änderungen am Brief-Generator-Prompt

---

## Erfolgskriterien

- [ ] Upload einer Nicht-Nebenkostenabrechnung → deutsche Info-Box, kein Analyse-Ergebnis
- [ ] Upload einer gültigen Abrechnung → Analyse läuft wie bisher
- [ ] Neue Fehlerregeln (§ 7 HeizkV, § 1 Abs. 2 BetrKV Reparatur/Verwaltung, § 259 BGB) werden erkannt wenn Belege vorhanden
- [ ] 503-Fehler beim Brief-Erstellen → deutsche Meldung statt englischer Stack-Trace
- [ ] `npm run build` läuft ohne Fehler
