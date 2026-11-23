const MODELL = {
  entitaeten: {
    kunde: {
      felder: {
        kundennummer: { typ: "Text", pflicht: true, regel: "eindeutig, Kurzform z. B. JD01" },
        kundenname: { typ: "Text", pflicht: true, regel: "" },
        lieferorte: { typ: "Mehrfachauswahl", pflicht: true, regel: "aus Standardliste" },
        bemerkung: { typ: "Text", pflicht: false, regel: "Freitext" },
        deaktiviert: { typ: "Ja/Nein", pflicht: false, regel: "deaktivierte Kunden erscheinen in keiner Auswahlliste" }
      }
    },
    bestandsposten: {
      felder: {
        postennummer: { typ: "Text", pflicht: true, regel: "eindeutig, automatisch vergeben" },
        kunde: { typ: "Verweis auf Kunde", pflicht: true, regel: "" },
        teilenummer: { typ: "Text", pflicht: true, regel: "frei nach Kundenangabe" },
        stueckzahl: { typ: "Ganzzahl", pflicht: true, regel: "muss > 0 sein" },
        farbcode: { typ: "Text", pflicht: true, regel: "" },
        anzahlBehaelter: { typ: "Ganzzahl", pflicht: true, regel: "muss > 0 sein" },
        behaeltertyp: { typ: "Verweis auf Behaeltertyp", pflicht: true, regel: "genau ein Typ pro Posten, nur aus Stamm waehlbar (R3)" },
        teileProBehaelter: { typ: "Ganzzahl", pflicht: true, regel: "" },
        wareneingangsdatum: { typ: "Datum", pflicht: true, regel: "Standardwert: heute" },
        bestellnummer: { typ: "Text", pflicht: false, regel: "leer erlaubt" },
        liefernummer: { typ: "Text", pflicht: false, regel: "separates Feld, leer erlaubt" },
        warenausgangsdatum: { typ: "Datum", pflicht: false, regel: "wird erst beim Abschluss gesetzt" },
        status: { typ: "Auswahlliste", pflicht: true, regel: "Rohteil, Produktion, Fertigteil, Abgeschlossen" },
        gesperrt: { typ: "Ja/Nein", pflicht: false, regel: "Rot-Ampel (R7)" },
        sperrgrund: { typ: "Text", pflicht: "bei Sperre", regel: "kurze Begruendung" },
        produktionsdatum: { typ: "Datum", pflicht: false, regel: "wird von Modul 2 gesetzt" },
        wunschliefertermin: { typ: "Datum", pflicht: false, regel: "Ergaenzung 20.11.2026: optional, leer erlaubt (keine Schaetztermine); rein informativ, keine Auswirkung auf Status/Sortierung; editierbar im Posten-Detail" },
        prio: { typ: "Ja/Nein", pflicht: false, regel: "Ergaenzung 20.11.2026: Standard Nein; Stern-Chip in Maske 3.1, Toggle in Maske 3.3; Setzen/Entfernen wird in der Historie protokolliert (Rollen-Einschraenkung erst in Phase-1-Folgesitzung)" }
      }
    },
    behaeltertyp: {
      felder: {
        behaeltercode: { typ: "Text", pflicht: true, regel: "eindeutig, z. B. SLT, EWP, KH4" },
        behaelterbeschreibung: { typ: "Text", pflicht: true, regel: "z. B. Sonderladungstraeger" },
        anzeigereihenfolge: { typ: "Ganzzahl", pflicht: true, regel: "kleine Nummer = oben in Planungslisten" },
        eingangsreihenfolge: { typ: "Ganzzahl", pflicht: true, regel: "Reihenfolge im Behaeltertyp-Dropdown des Wareneingangs (Entscheid 20.11.2026)" },
        deaktiviert: { typ: "Ja/Nein", pflicht: false, regel: "deaktivierte Typen sind im Wareneingang nicht waehlbar" }
      }
    },
    bestandsbewegung: {
      felder: {
        posten: { typ: "Verweis auf Bestandsposten", pflicht: true, regel: "" },
        bewegungsart: { typ: "Auswahlliste", pflicht: true, regel: "automatisch gefuehrt, keine manuelle Erfassung" },
        datumUhrzeit: { typ: "Datum/Uhrzeit", pflicht: true, regel: "automatisch" },
        vorherWert: { typ: "Text", pflicht: false, regel: "Status und/oder Stueckzahl vorher" },
        nachherWert: { typ: "Text", pflicht: false, regel: "Status und/oder Stueckzahl nachher" },
        benutzer: { typ: "Text", pflicht: true, regel: "automatisch aus Anmeldung" }
      }
    }
  },
  statusDefinition: [
    { status: "Rohteil", bedeutung: "Angeliefert, wartet auf Produktion", naechster: "Produktion" },
    { status: "Produktion", bedeutung: "In der Kabinenplanung/bearbeitet", naechster: "Fertigteil" },
    { status: "Fertigteil", bedeutung: "Fertig, liegt im Fertigteillager oder wartet auf sofortige Lieferung", naechster: "Abgeschlossen" },
    { status: "Abgeschlossen", bedeutung: "Ausgeliefert (Warenausgangsdatum gesetzt)", naechster: "keiner; nur Ansicht" }
  ],
  bewegungsarten: [
    "Wareneingang", "Einplanung", "Statuswechsel", "Produktion abgeschlossen",
    "Einlagerung", "Abrufzuordnung", "Warenausgang", "Mengenkorrektur",
    "Sperren", "Entsperren", "Retoure",
    "Prio gesetzt", "Prio entfernt", "Wunsch-Liefertermin geaendert"
  ],
  farbcodeRegelwerk: [
    { farbcode: "A2", name: "John Deere gruen", standardKabine: "Automatik", beschichtungsart: "einfach" },
    { farbcode: "A2ZZ2", name: "John Deere gruen", standardKabine: "Automatik", beschichtungsart: "2-fach (ZZ2: Primer + Decklack)" },
    { farbcode: "T2", name: "John Deere schwarz", standardKabine: "Hand", beschichtungsart: "einfach" },
    { farbcode: "T2ZZ2", name: "John Deere schwarz", standardKabine: "Hand", beschichtungsart: "2-fach (ZZ2: Primer + Decklack)" },
    { farbcode: "F9H", name: "John Deere gelb", standardKabine: "Hand", beschichtungsart: "einfach" },
    { farbcode: "BLACK8", name: "Kubota Black 8", standardKabine: "Hand", beschichtungsart: "einfach" },
    { farbcode: "RED1", name: "Kubota Red 1", standardKabine: "Hand", beschichtungsart: "einfach" }
  ],
  regeln: {
    R1: "Stueckzahl = Anzahl Behaelter x Teilestueckzahl pro Behaelter; Abweichung -> Warnung mit 'Trotzdem speichern'",
    R2: "Nur Status Rohteil und Produktion sind mengenmaessig editierbar",
    R3: "Behaeltercode muss im Packmittel-Stamm vorhanden sein; genau ein Behaeltertyp pro Posten",
    R4: "Warenausgang nur aus Status Fertigteil; Status wechselt automatisch auf Abgeschlossen",
    R5: "Loeschen aktiver Posten nicht erlaubt, nur Mengenkorrektur",
    R6: "Mengenkorrektur nur durch Buero/Admin; Historie protokolliert Aenderung und Benutzer",
    R7: "Sperre (rot) nur durch Buero/Admin mit Sperrgrund; gesperrte Posten sind blockiert",
    R8: "Retoure nur mit Retoure-Grund (Nacharbeit/Reklamation); neuer Posten als Rohteil"
  }
};
