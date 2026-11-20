# AENDERUNGEN.md – Änderungsprotokoll der App

Dieses Protokoll dokumentiert **Umsetzungsänderungen der App** ( deviations vom Plan, Rückmeldungen aus dem Test, Fixes) mit Datum und Commit.

**Grundsatz:** Änderungen an der *Planung selbst* (Masken, Regeln, Datenmodell-Vorgaben) gehören in die `Gesamtplanung_App_Pulverbeschichtung.docx` – diese Datei bleibt die alleinige Planungsquelle. Dieses Protokoll hier dokumentiert nur, was in der App tatsächlich gebaut bzw. geändert wurde und warum.

Neueste Einträge oben. Format beibehalten: `Datum | Sitzung | Änderung | Grund/Anlass | Commit`.

| Datum | Sitzung | Änderung | Grund/Anlass | Commit |
|---|---|---|---|---|
| 20.11.2026 | Sitzung 2 | **Wareneingang (Maske 3.2) gebaut:** Kopf (Kunde Pflicht, WE-Datum Standard heute), Positionstabelle (Buchungsart Neuanlieferung/Retoure mit orange Pflicht-Zeile Retoure-Grund, Teilenummer mit Kunden-Vorschlägen, Beschreibung mit Vorauswahlliste, Farbcode, Stückzahl, Behältertyp-Dropdown in Häufigkeitsreihenfolge, Anzahl Behälter, Teile je Behälter, Bestell-/Liefernummer, Löschen je Zeile, „+ Weitere Position“). Prüfungen je Zeile: Pflichtfelder + R1 als Warnung mit „Trotzdem speichern“ je Zeile, beim Speichern konkrete Meldung zur ersten auffälligen Position. Speichern legt alle Zeilen auf einmal als eigene Posten (Status Rohteil, Nummern P-2026-00xx fortlaufend) an, schreibt Historie (Wareneingang/Retoure), zeigt Bestätigung mit allen Posten-Nummern und wechselt zurück in die Übersicht. Retoure-Posten tragen sichtbares Badge (R8). Smoke-Test Sitzung 2 bestanden | Bauplan Sitzung 2, Maske 3.2, Regeln R1/R8, Abnahmekriterien 1, 3, 8 | siehe nächster Commit |
| 20.11.2026 | Sitzung 1 | **Behälterstamm aus echter `Behälter.xlsx` importiert** (`python tools/behaelter-import.py Behälter.xlsx`; Datei per GitHub-Upload im Repo-Wurzelverzeichnis, Commit cdacdab): 34 Typen, Codes **1:1 identisch** zur Planungs-Reihenfolge, 7 Sondergestelle als eigene Typen. Tippfehler bereinigt: Spaltentitel „Behätercode“, „Ausatzrahmen“ → „Aufsatzrahmen“ (z. B. PKC „Europalette + 5 Aufsatzrahmen“); Codes unverändert. Beschreibungen jetzt im Original (deutsche Umlaute) statt Platzhalter. Smoke-Test bestanden. | Bauplan: Behälterstamm aus Behälter.xlsx, Blatt „Daten“ | siehe nächster Commit |
| 20.11.2026 | Sitzung 1 | Import-Tool `tools/behaelter-import.py` gehärtet: Spaltentitel-Tippfehler auch mit Umlaut („Behätercode“) wird erkannt. End-to-End-Test mit synthetischer xlsx (Blatt „Daten“, 34 Codes, beide Tippfehler aus dem Bauplan) bestanden: Ergebnis byte-identisch zum eingecheckten Stamm, „Ausatzrahmen“ → „Aufsatzrahmen“ bereinigt, Codes unverändert. Echte Behälter.xlsx kam dann per GitHub-Upload ins Repo (Commit cdacdab) – siehe nächster Eintrag | Behälter.xlsx „hochgeladen“ gemeldet | 27bf961 |
| 20.11.2026 | Sitzung 1 | `Gesamtplanung_App_Pulverbeschichtung.docx` (Stand 19.11.2026) nach `docs/` ins Repo übernommen und versioniert (byte-identisch, md5 geprüft) | Bauplan Schritt 1: aktuelle Gesamtplanung liegt im Projektordner; Nutzerfreigabe zur Versionierung im Repo | 4dab3c1 |
| 20.11.2026 | Test | Farbschema aller Ansichten auf Blau umgestellt (Markenfarbe); Farben zentral als CSS-Variablen in `:root` (`style.css`), aktuell `#005ca9` / `#00417a`. Ampel- und Statusfarben bleiben semantisch (grün/gelb/rot). | Rückmeldung Test: Hausfarbe blau (www.buch-lot.de; exakter Hex-Wert dort nicht automatisiert auslesbar, in `:root` zentral anpassbar) | 8f0794d |
| 20.11.2026 | Test | Spalten **Farbcode und Beschreibung getauscht** (neu: … Teilenummer, Farbcode, Beschreibung, Behälter …) | Rückmeldung Test | 8f0794d |
| 20.11.2026 | Test | Spalte **Behälter um „je“-Angabe ergänzt**: „5 × GKA je 20 (= 100)“ statt nur „5 × GKA“ | Rückmeldung Test; Teile-je-Behälter aus Phase 1 als „je“-Angabe (Phase-2-Planung) | 3a4b489 |
| 20.11.2026 | Test | Fix: Tabellenkopf wurde in leere `<tr>` im `<thead>` verschachtelt → Spalten standen verschoben. Jetzt `<thead></thead>` + Rendern direkt in `thead`; Smoke-Test prüft Kopfzeilen-Struktur | Rückmeldung Test: „Tabelle völlig verschoben“ | fd1b89b |
| 20.11.2026 | Sitzung 1 | Erster Stand: Datenmodell (Kunde, Bestandsposten, Behältertyp, Bestandsbewegung, Status), Behälterstamm (34 Typen inkl. 7 Sondergestelle), Bestandsübersicht Maske 3.1 (Filter, Suche, Ampel, Sortierung, Liegezeit), 20 Beispielposten, Start per `index.html`/`start.bat` | Bauplan „Eigenbau Phase 1“, Sitzung 1, Detailplanung Phase 1 | b289e29 |

## Offene Punkte (nächste Sitzungen)

- ~~Sitzung 2: Wareneingang (Maske 3.2)~~ erledigt.
- Sitzung 3: Posten-Detail mit Historie (Masken 3.3/3.4), Mengenkorrektur (R6), Sperren/Entsperren mit Grund (R7).
- Sitzung 4: Rollen/Benutzerverwaltung, Kundenstamm, Behälterstamm-Pflege (Masken 3.5–3.7), Durchtestung Kriterien 1–8.
