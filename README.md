# Bestandsfuehrung Pulverbeschichtung – Phase 1, Sitzung 1

Einfache Web-App (nur statische Dateien, kein Installieren, kein Server) fuer die
Bestandsfuehrung der Kundenteile – gebaut nach `Gesamtplanung_App_Pulverbeschichtung.docx`,
Abschnitt „Detailplanung Phase 1“ (Datenmodell + Maske 3.1 Bestandsuebersicht).

## App starten

- **Windows:** `start.bat` doppelklicken – oeffnet die App im Browser.
- ** Ueberall sonst:** `index.html` doppelklicken (funktioniert direkt per Doppelklick, kein Server noetig).

Beim ersten Start werden 20 Beispiel-Posten geladen und lokal im Browser gespeichert
(localStorage). „Beispieldaten zuruecksetzen“ laedt sie jederzeit neu.

## Was ist in dieser Sitzung gebaut

- **Datenmodell** laut Planung (`js/modell.js`): Kunde, Bestandsposten, Behaeltertyp,
  Bestandsbewegung, Statusdefinition (Rohteil → Produktion → Fertigteil → Abgeschlossen)
  sowie die Regeln R1–R8 als hinterlegte Referenzen.
- **Behaelterstamm** (`js/behaelterstamm.js`): alle 34 Packmittel-Typen inkl. der sieben
  Sondergestelle als eigene Typen, mit Anzeige- und Eingangsreihenfolge laut Planung.
- **Wareneingang (Maske 3.2)**: Kopf (Kunde, Wareneingangsdatum) + Positionstabelle mit Buchungsart (Neuanlieferung/Retoure mit Pflicht-Grund), Vorauswahllisten (Beschreibung, Teilenummer je Kunde), Behaeltertyp-Dropdown in Haeufigkeitsreihenfolge, Pruefung R1 je Zeile mit "Trotzdem speichern", Sammelspeichern aller Zeilen als eigene Posten (Status Rohteil) inkl. Historie und Bestaetigung der Posten-Nummern.
- **Bestandsuebersicht (Maske 3.1)** (`index.html` + `js/app.js`):
  Filterleiste (Kunde, Status inkl. „Gesperrt“, Teilenummer, Behaeltertyp, Bestellnummer,
  Liefernummer), Suchfeld, Ampel (gruen = Fertigteil, gelb = Produktion, rot = gesperrt,
  ohne Farbe = Rohteil), Spaltenfolge laut Planung, Standardsortierung nach Kunde +
  Wareneingangsdatum aufsteigend (FIFO), Liegezeit in Tagen, Status als Farbbadge.
- **Beispieldaten:** 7 Kunden, 20 Posten ueber alle Status, darunter ein gesperrter Posten
  mit Grund (rote Ampel), plus Historie-Eintraege (Bestandsbewegung „Wareneingang“/„Sperren“).

## Behaelterstamm aus Behaelter.xlsx neu importieren

`Behaelter.xlsx` liegt im Repo-Wurzelverzeichnis (Blatt „Daten“, Spalten Behälterbeschreibung/Behätercode – Tippfehler im Spaltentitel werden automatisch bereinigt):

```
python tools/behaelter-import.py Behaelter.xlsx
```

Das schreibt `js/behaelterstamm.js` neu (Tippfehler im Blatt werden bereinigt, Codes bleiben
unveraendert). Ohne Excel regeneriert `python tools/behaelter-import.py --aus-planung` den Stamm
aus der Planung.

## Aufbau

```
AENDERUNGEN.md        Aenderungsprotokoll der App (Umsetzungsaenderungen, Fixes, Commits)
docs/                 Gesamtplanung_App_Pulverbeschichtung.docx (versionierte Planungsgrundlage, Stand 19.11.2026)
Behaelter.xlsx        Packmittel-Typen-Liste (Quelle fuer den Behaelterstamm-Import)
index.html            Einstieg, laedt die App
style.css             Darstellung
js/modell.js          Datenmodell laut Planung (Entitaeten, Status, Regeln)
js/behaelterstamm.js  34 Behaeltertypen (generiert, siehe tools/)
js/stammdaten.js      Kundenstamm + 20 Beispielposten + Historie
js/app.js             Logik der Bestandsuebersicht (Filter, Suche, Sortierung, Ampel)
tools/behaelter-import.py  Behaelter.xlsx -> js/behaelterstamm.js
start.bat             Start per Doppelklick (Windows)
```

## Naechste Sitzungen (laut Bauplan)

1. ~~Sitzung 2: Wareneingang (Maske 3.2)~~ erledigt.
2. Sitzung 3: Posten-Detail mit Historie, Mengenkorrektur, Sperren/Entsperren (Masken 3.3/3.4).
3. Sitzung 4: Rollen/Benutzer, Kundenstamm, Behaelterstamm-Pflege (Masken 3.5–3.7), Durchtestung.
