const LIEFERORTE = ["JDWZ", "JDH", "Zewe", "StaMaTec", "KBM", "Sonstige"];

const KUNDENSTAMM = [
  { kundennummer: "HN01", kundenname: "Hennecke", lieferorte: ["JDWZ"], bemerkung: "", deaktiviert: false },
  { kundennummer: "HU01", kundenname: "Huissel", lieferorte: ["JDWZ"], bemerkung: "", deaktiviert: false },
  { kundennummer: "VD01", kundenname: "VDL", lieferorte: ["JDWZ", "JDH"], bemerkung: "", deaktiviert: false },
  { kundennummer: "ZE01", kundenname: "Zewe", lieferorte: ["Zewe"], bemerkung: "", deaktiviert: false },
  { kundennummer: "KB01", kundenname: "Kubota Baumaschinen GmbH", lieferorte: ["KBM"], bemerkung: "Abrufkunde, keine Lagerhaltung", deaktiviert: false },
  { kundennummer: "WB01", kundenname: "Weber", lieferorte: ["JDWZ"], bemerkung: "Produktion Montag, Anlieferung Mi der Vorwoche", deaktiviert: false },
  { kundennummer: "ST01", kundenname: "StaMaTec", lieferorte: ["StaMaTec"], bemerkung: "Produktion Dienstag, Teilmenge Selbstabholung", deaktiviert: false }
];

function datumVor(tage, stunde, minute) {
  const d = new Date();
  d.setDate(d.getDate() - tage);
  d.setHours(stunde || 0, minute || 0, 0, 0);
  return d;
}

function isoDatum(d) {
  return d.toISOString().slice(0, 10);
}

const BEISPIEL_ROHPOSTEN = [
  ["P-2026-0001", "HN01", "JD-4326-110", "gruen", "A2", 120, 3, "GKA", 40, 21, "B-2026-114", "L-88231", "Rohteil", false, ""],
  ["P-2026-0002", "HN01", "JD-4326-110", "gruen", "A2", 80, 2, "GKA", 40, 21, "B-2026-114", "L-88231", "Rohteil", false, ""],
  ["P-2026-0003", "HN01", "JD-7721-045", "schwarz", "T2", 60, 1, "SJ6", 60, 18, "B-2026-121", "", "Rohteil", false, ""],
  ["P-2026-0004", "HU01", "HU-9980-12", "Primer + gruen", "A2ZZ2", 150, 3, "PK2", 50, 16, "", "L-88410", "Rohteil", false, ""],
  ["P-2026-0005", "HU01", "HU-9980-12", "Primer + gruen", "A2ZZ2", 50, 1, "Karton", 50, 16, "", "L-88410", "Rohteil", false, ""],
  ["P-2026-0006", "VD01", "VDL-3310-77", "schwarz matt", "T2 matt", 48, 2, "GK4", 24, 14, "B-2026-130", "L-88455", "Produktion", false, ""],
  ["P-2026-0007", "VD01", "VDL-3310-77", "schwarz matt", "T2 matt", 96, 4, "GKA", 24, 9, "B-2026-141", "", "Produktion", false, ""],
  ["P-2026-0008", "VD01", "VDL-5502-30", "gruen", "A2", 200, 5, "GKA", 40, 7, "", "L-88502", "Fertigteil", false, ""],
  ["P-2026-0009", "ZE01", "ZW-1188-04", "Primer + schwarz", "T2ZZ2", 36, 2, "SJ3", 18, 12, "B-2026-118", "", "Rohteil", false, ""],
  ["P-2026-0010", "ZE01", "ZW-1188-04", "Primer + schwarz", "T2ZZ2", 90, 3, "EWP", 30, 5, "B-2026-118", "", "Fertigteil", false, ""],
  ["P-2026-0011", "KB01", "KBM-6650-21", "gruen", "A2", 64, 4, "KH4", 16, 20, "B-KBM-332", "L-77120", "Rohteil", false, ""],
  ["P-2026-0012", "KB01", "KBM-6650-21", "gruen", "A2", 32, 2, "KH4", 16, 20, "B-KBM-332", "L-77120", "Rohteil", false, ""],
  ["P-2026-0013", "KB01", "KBM-2210-08", "schwarz", "T2", 24, 1, "SLT", 24, 11, "", "L-77201", "Produktion", false, ""],
  ["P-2026-0014", "WB01", "WB-4455-90", "rot", "Red 1", 100, 5, "PK2", 20, 15, "B-WB-587", "", "Rohteil", false, ""],
  ["P-2026-0015", "WB01", "WB-4455-90", "rot", "Red 1", 60, 3, "PK2", 20, 8, "B-WB-601", "", "Fertigteil", false, ""],
  ["P-2026-0016", "ST01", "ST-9021-33", "gelb", "GE1", 45, 3, "GKA", 15, 13, "", "L-66340", "Rohteil", false, ""],
  ["P-2026-0017", "ST01", "ST-9021-33", "gelb", "GE1", 30, 2, "GK4", 15, 13, "", "L-66340", "Produktion", false, ""],
  ["P-2026-0018", "HN01", "JD-1102-66", "Black 8", "BL8", 18, 2, "IMD244285", 9, 6, "B-2026-150", "", "Rohteil", true, "Qualitaetsbefund, Freigabe ausstehend"],
  ["P-2026-0019", "VD01", "VDL-7788-19", "Primer + gruen", "A2ZZ2", 80, 2, "RDL", 40, 4, "", "L-88590", "Rohteil", false, ""],
  ["P-2026-0020", "ZE01", "ZW-7745-02", "schwarz matt", "T2 matt", 12, 1, "Holzbox", 12, 2, "B-2026-155", "", "Rohteil", false, ""]
];

function beispielDaten() {
  const posten = [];
  const bewegungen = [];
  BEISPIEL_ROHPOSTEN.forEach(function (r, i) {
    const weDatum = isoDatum(datumVor(r[9]));
    const posten_ = {
      postennummer: r[0],
      kunde: r[1],
      teilenummer: r[2],
      beschreibung: r[3],
      farbcode: r[4],
      stueckzahl: r[5],
      anzahlBehaelter: r[6],
      behaeltertyp: r[7],
      teileProBehaelter: r[8],
      wareneingangsdatum: weDatum,
      bestellnummer: r[10],
      liefernummer: r[11],
      warenausgangsdatum: null,
      status: r[12],
      gesperrt: r[13],
      sperrgrund: r[14],
      produktionsdatum: null
    };
    posten.push(posten_);
    bewegungen.push({
      id: "B-" + String(i + 1).padStart(4, "0"),
      posten: r[0],
      bewegungsart: "Wareneingang",
      datumUhrzeit: datumVor(r[9], 8, 15 + i).toISOString(),
      vorherWert: null,
      nachherWert: "Status Rohteil, " + r[4] + " Stueck",
      benutzer: "Buero (Beispiel)"
    });
    if (r[13]) {
      bewegungen.push({
        id: "B-" + String(100 + i).padStart(4, "0"),
        posten: r[0],
        bewegungsart: "Sperren",
        datumUhrzeit: datumVor(r[9], 10, 30).toISOString(),
        vorherWert: "nicht gesperrt",
        nachherWert: "gesperrt: " + r[14],
        benutzer: "Buero (Beispiel)"
      });
    }
  });
  return { posten: posten, bewegungen: bewegungen };
}
