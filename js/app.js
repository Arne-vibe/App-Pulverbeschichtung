const SPEICHER_KEY = "pulverbeschichtung.phase1.v1";

const zustand = {
  posten: [],
  bewegungen: [],
  filter: { kunde: "", status: "", teilenummer: "", behaeltertyp: "", bestellnummer: "", liefernummer: "" },
  suche: "",
  sortierung: { schluessel: "kunde", richtung: 1 }
};

function ladeDaten() {
  try {
    const roh = localStorage.getItem(SPEICHER_KEY);
    if (roh) {
      const daten = JSON.parse(roh);
      zustand.posten = daten.posten || [];
      zustand.bewegungen = daten.bewegungen || [];
      return;
    }
  } catch (e) {
    console.warn("Gespeicherte Daten konnten nicht gelesen werden, Beispieldaten werden verwendet.", e);
  }
  BeispieldatenUebernehmen();
}

function BeispieldatenUebernehmen() {
  const daten = beispielDaten();
  zustand.posten = daten.posten;
  zustand.bewegungen = daten.bewegungen;
  speichereDaten();
}

function speichereDaten() {
  localStorage.setItem(SPEICHER_KEY, JSON.stringify({ posten: zustand.posten, bewegungen: zustand.bewegungen }));
}

function kundeZu(posten) {
  return KUNDENSTAMM.find(function (k) { return k.kundennummer === posten.kunde; });
}

function behaelterZu(code) {
  return BEHAELTERSTAMM.find(function (b) { return b.behaeltercode === code; });
}

function ampelKlasse(posten) {
  if (posten.gesperrt) return "rot";
  if (posten.status === "Fertigteil") return "gruen";
  if (posten.status === "Produktion") return "gelb";
  return "leer";
}

function ampelTitel(posten) {
  if (posten.gesperrt) return "Gesperrt: " + (posten.sperrgrund || "blockiert fuer Produktion und Lieferung");
  if (posten.status === "Fertigteil") return "Fertigteil";
  if (posten.status === "Produktion") return "In Produktion";
  return "Rohteil (noch kein Beginn)";
}

function liegezeitTage(posten) {
  const we = new Date(posten.wareneingangsdatum + "T00:00:00");
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  return Math.floor((heute - we) / 86400000);
}

function statusBadgeKlasse(status) {
  return {
    Rohteil: "badge-rohteil",
    Produktion: "badge-produktion",
    Fertigteil: "badge-fertigteil",
    Abgeschlossen: "badge-abgeschlossen"
  }[status] || "badge-rohteil";
}

function formatDatum(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE");
}

function textEnthaelt(haystack, nadel) {
  return haystack.toLowerCase().indexOf(nadel.toLowerCase()) !== -1;
}

function postenGefiltert() {
  const f = zustand.filter;
  const suche = zustand.suche.trim();
  return zustand.posten.filter(function (p) {
    if (f.kunde && p.kunde !== f.kunde) return false;
    if (f.status === "Gesperrt") {
      if (!p.gesperrt) return false;
    } else if (f.status && p.status !== f.status) {
      return false;
    }
    if (f.teilenummer && !textEnthaelt(p.teilenummer, f.teilenummer)) return false;
    if (f.behaeltertyp && p.behaeltertyp !== f.behaeltertyp) return false;
    if (f.bestellnummer && !textEnthaelt(p.bestellnummer || "", f.bestellnummer)) return false;
    if (f.liefernummer && !textEnthaelt(p.liefernummer || "", f.liefernummer)) return false;
    if (suche) {
      const k = kundeZu(p) || { kundennummer: p.kunde, kundenname: p.kunde };
      const haystack = [p.postennummer, k.kundennummer, k.kundenname, p.teilenummer, p.beschreibung, p.farbcode, p.behaeltertyp, p.bestellnummer, p.liefernummer].join(" ");
      if (!textEnthaelt(haystack, suche)) return false;
    }
    return true;
  });
}

function sortWert(p, schluessel) {
  const k = kundeZu(p);
  switch (schluessel) {
    case "kunde": return (k ? k.kundenname : p.kunde).toLowerCase();
    case "stueckzahl": return p.stueckzahl;
    case "teilenummer": return p.teilenummer.toLowerCase();
    case "beschreibung": return (p.beschreibung || "").toLowerCase();
    case "farbcode": return p.farbcode.toLowerCase();
    case "behaelter": return p.behaeltertyp.toLowerCase();
    case "bestellnummer": return (p.bestellnummer || "").toLowerCase();
    case "liefernummer": return (p.liefernummer || "").toLowerCase();
    case "status": return p.status;
    case "wareneingangsdatum": return p.wareneingangsdatum;
    case "liegezeit": return liegezeitTage(p);
    default: return "";
  }
}

function postenSortiert(liste) {
  const s = zustand.sortierung;
  const kopie = liste.slice();
  kopie.sort(function (a, b) {
    const va = sortWert(a, s.schluessel);
    const vb = sortWert(b, s.schluessel);
    let cmp;
    if (typeof va === "number" && typeof vb === "number") {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), "de");
    }
    if (cmp !== 0) return cmp * s.richtung;
    const ka = (kundeZu(a) ? kundeZu(a).kundenname : a.kunde).toLowerCase();
    const kb = (kundeZu(b) ? kundeZu(b).kundenname : b.kunde).toLowerCase();
    if (ka !== kb) return ka.localeCompare(kb, "de");
    if (a.wareneingangsdatum !== b.wareneingangsdatum) return a.wareneingangsdatum < b.wareneingangsdatum ? -1 : 1;
    return a.postennummer.localeCompare(b.postennummer);
  });
  return kopie;
}

const SPALTEN = [
  { schluessel: "ampel", titel: "Ampel", sortierbar: false },
  { schluessel: "kunde", titel: "Kunde", sortierbar: true },
  { schluessel: "stueckzahl", titel: "Stueckzahl", sortierbar: true },
  { schluessel: "teilenummer", titel: "Teilenummer", sortierbar: true },
  { schluessel: "beschreibung", titel: "Beschreibung", sortierbar: true },
  { schluessel: "farbcode", titel: "Farbcode", sortierbar: true },
  { schluessel: "behaelter", titel: "Behaelter", sortierbar: true },
  { schluessel: "bestellnummer", titel: "Bestellnummer", sortierbar: true },
  { schluessel: "liefernummer", titel: "Liefernummer", sortierbar: true },
  { schluessel: "status", titel: "Status", sortierbar: true },
  { schluessel: "wareneingangsdatum", titel: "Wareneingangsdatum", sortierbar: true },
  { schluessel: "liegezeit", titel: "Liegezeit", sortierbar: true }
];

function fuelleKundenSelect(select) {
  select.innerHTML = '<option value="">alle Kunden</option>';
  KUNDENSTAMM.filter(function (k) { return !k.deaktiviert; }).forEach(function (k) {
    const opt = document.createElement("option");
    opt.value = k.kundennummer;
    opt.textContent = k.kundennummer + " – " + k.kundenname;
    select.appendChild(opt);
  });
}

function fuelleBehaelterSelect(select) {
  select.innerHTML = '<option value="">alle Behaeltertypen</option>';
  BEHAELTERSTAMM.filter(function (b) { return !b.deaktiviert; })
    .slice()
    .sort(function (a, b) { return a.anzeigereihenfolge - b.anzeigereihenfolge; })
    .forEach(function (b) {
      const opt = document.createElement("option");
      opt.value = b.behaeltercode;
      opt.textContent = b.behaeltercode + " – " + b.behaelterbeschreibung;
      select.appendChild(opt);
    });
}

function fuelleStatusSelect(select) {
  select.innerHTML = '<option value="">alle Status</option>';
  MODELL.statusDefinition.forEach(function (s) {
    const opt = document.createElement("option");
    opt.value = s.status;
    opt.textContent = s.status;
    select.appendChild(opt);
  });
  const opt = document.createElement("option");
  opt.value = "Gesperrt";
  opt.textContent = "Gesperrt (rote Ampel)";
  select.appendChild(opt);
}

function rendernKopfzeile(tbodyKopf) {
  tbodyKopf.innerHTML = "";
  const tr = document.createElement("tr");
  SPALTEN.forEach(function (sp) {
    const th = document.createElement("th");
    th.textContent = sp.titel;
    if (sp.sortierbar) {
      th.classList.add("sortierbar");
      const s = zustand.sortierung;
      if (s.schluessel === sp.schluessel) {
        th.classList.add(s.richtung === 1 ? "aufsteigend" : "absteigend");
        th.textContent = sp.titel + (s.richtung === 1 ? " ▲" : " ▼");
      }
      th.addEventListener("click", function () {
        if (zustand.sortierung.schluessel === sp.schluessel) {
          zustand.sortierung.richtung = -zustand.sortierung.richtung;
        } else {
          zustand.sortierung.schluessel = sp.schluessel;
          zustand.sortierung.richtung = 1;
        }
        rendern();
      });
    }
    tr.appendChild(th);
  });
  tbodyKopf.appendChild(tr);
}

function rendernTabelle() {
  const thead = document.querySelector("#bestandstabelle thead");
  rendernKopfzeile(thead);
  const tbody = document.querySelector("#bestandstabelle tbody");
  tbody.innerHTML = "";
  const liste = postenSortiert(postenGefiltert());
  document.getElementById("postenZaehler").textContent = liste.length + " von " + zustand.posten.length + " Posten";
  if (liste.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = SPALTEN.length;
    td.className = "leer";
    td.textContent = "Keine Posten gefunden. Filter oder Suche anpassen.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  liste.forEach(function (p) {
    const k = kundeZu(p);
    const tr = document.createElement("tr");
    if (p.gesperrt) tr.classList.add("gesperrt");

    const tdAmpel = document.createElement("td");
    const ampel = document.createElement("span");
    ampel.className = "ampel " + ampelKlasse(p);
    ampel.title = ampelTitel(p);
    tdAmpel.appendChild(ampel);
    tr.appendChild(tdAmpel);

    const zellen = [
      k ? k.kundennummer + " – " + k.kundenname : p.kunde,
      String(p.stueckzahl),
      p.teilenummer,
      p.beschreibung || "",
      p.farbcode,
      p.anzahlBehaelter + " × " + p.behaeltertyp,
      p.bestellnummer || "",
      p.liefernummer || ""
    ];
    zellen.forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });

    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + statusBadgeKlasse(p.status);
    badge.textContent = p.status;
    if (p.gesperrt) {
      const sperr = document.createElement("span");
      sperr.className = "badge badge-gesperrt";
      sperr.textContent = "gesperrt";
      sperr.title = p.sperrgrund || "";
      tdStatus.appendChild(badge);
      tdStatus.appendChild(sperr);
    } else {
      tdStatus.appendChild(badge);
    }
    tr.appendChild(tdStatus);

    const tdWe = document.createElement("td");
    tdWe.textContent = formatDatum(p.wareneingangsdatum);
    tr.appendChild(tdWe);

    const tdLiege = document.createElement("td");
    const tage = liegezeitTage(p);
    tdLiege.textContent = tage === 0 ? "heute" : tage + " Tage";
    tr.appendChild(tdLiege);

    tbody.appendChild(tr);
  });
}

function rendern() {
  rendernTabelle();
}

function filterVerbinden() {
  const felder = {
    filterKunde: "kunde",
    filterStatus: "status",
    filterTeilenummer: "teilenummer",
    filterBehaeltertyp: "behaeltertyp",
    filterBestellnummer: "bestellnummer",
    filterLiefernummer: "liefernummer"
  };
  Object.keys(felder).forEach(function (id) {
    const el = document.getElementById(id);
    el.addEventListener("input", function () {
      zustand.filter[felder[id]] = el.value;
      rendern();
    });
    el.addEventListener("change", function () {
      zustand.filter[felder[id]] = el.value;
      rendern();
    });
  });
  document.getElementById("suche").addEventListener("input", function (e) {
    zustand.suche = e.target.value;
    rendern();
  });
  document.getElementById("zuruecksetzen").addEventListener("click", function () {
    if (confirm("Alle Aenderungen verwerfen und die 20 Beispiel-Posten neu laden?")) {
      BeispieldatenUebernehmen();
      rendern();
    }
  });
}

function init() {
  ladeDaten();
  fuelleKundenSelect(document.getElementById("filterKunde"));
  fuelleStatusSelect(document.getElementById("filterStatus"));
  fuelleBehaelterSelect(document.getElementById("filterBehaeltertyp"));
  filterVerbinden();
  rendern();
}

document.addEventListener("DOMContentLoaded", init);
