const SPEICHER_KEY = "pulverbeschichtung.phase1.v1";
const BENUTZER = "Buero";

const zustand = {
  posten: [],
  bewegungen: [],
  filter: { kunde: "", status: "", teilenummer: "", behaeltertyp: "", bestellnummer: "", liefernummer: "" },
  suche: "",
  sortierung: { schluessel: "kunde", richtung: 1 },
  eingang: { kunde: "", datum: "", positionen: [] }
};

function heuteIso() {
  const d = new Date();
  const pad = function (n) { return String(n).padStart(2, "0"); };
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function ladeDaten() {
  try {
    const roh = localStorage.getItem(SPEICHER_KEY);
    if (roh) {
      const daten = JSON.parse(roh);
      zustand.posten = daten.posten || [];
      zustand.bewegungen = daten.bewegungen || [];
      zustand.eingang = { kunde: "", datum: heuteIso(), positionen: [neuePosition()] };
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
  zustand.eingang = { kunde: "", datum: heuteIso(), positionen: [neuePosition()] };
  speichereDaten();
}

function speichereDaten() {
  localStorage.setItem(SPEICHER_KEY, JSON.stringify({ posten: zustand.posten, bewegungen: zustand.bewegungen }));
}

function kundeZu(posten) {
  return KUNDENSTAMM.find(function (k) { return k.kundennummer === posten.kunde; });
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
    case "farbcode": return p.farbcode.toLowerCase();
    case "beschreibung": return (p.beschreibung || "").toLowerCase();
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

function fuelleKundenSelect(select, mitLeer) {
  select.innerHTML = mitLeer ? '<option value="">bitte waehlen</option>' : '<option value="">alle Kunden</option>';
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

function rendernKopfzeile(thead) {
  thead.innerHTML = "";
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
  thead.appendChild(tr);
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
      p.anzahlBehaelter + " × " + p.behaeltertyp + " je " + p.teileProBehaelter + " (= " + p.stueckzahl + ")",
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
    tdStatus.appendChild(badge);
    if (p.retoureGrund) {
      const ret = document.createElement("span");
      ret.className = "badge badge-retoure";
      ret.textContent = "Retoure: " + p.retoureGrund;
      tdStatus.appendChild(ret);
    }
    if (p.gesperrt) {
      const sperr = document.createElement("span");
      sperr.className = "badge badge-gesperrt";
      sperr.textContent = "gesperrt";
      sperr.title = p.sperrgrund || "";
      tdStatus.appendChild(sperr);
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

function zeigeBestaetigung(text) {
  const el = document.getElementById("bestaetigung");
  el.textContent = text;
  el.hidden = false;
}

function zeigeAnsicht(name) {
  document.getElementById("ansicht-bestand").hidden = name !== "bestand";
  document.getElementById("ansicht-wareneingang").hidden = name !== "wareneingang";
  document.getElementById("navBestand").className = "nav" + (name === "bestand" ? " aktiv" : "");
  document.getElementById("wareneingang").className = "nav" + (name === "wareneingang" ? " aktiv" : "");
  if (name === "wareneingang") rendernEingang();
  if (name === "bestand") rendern();
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

function neuePosition() {
  return {
    buchungsart: "Neuanlieferung",
    teilenummer: "",
    beschreibung: "",
    farbcode: "",
    stueckzahl: "",
    behaeltertyp: "",
    anzahlBehaelter: "",
    teileProBehaelter: "",
    bestellnummer: "",
    liefernummer: "",
    retoureGrund: "",
    r1Bestaetigt: false
  };
}

function r1Abweichung(pos) {
  if (pos.stueckzahl === "" || pos.anzahlBehaelter === "" || pos.teileProBehaelter === "") return null;
  const s = Number(pos.stueckzahl);
  const a = Number(pos.anzahlBehaelter);
  const t = Number(pos.teileProBehaelter);
  if (isNaN(s) || isNaN(a) || isNaN(t)) return null;
  if (s === a * t) return null;
  return { stueckzahl: s, gerechnet: a * t, anzahl: a, teile: t };
}

function naechstePostenNummer(jahr) {
  const prefix = "P-" + jahr + "-";
  let max = 0;
  zustand.posten.forEach(function (p) {
    if (p.postennummer.indexOf(prefix) === 0) {
      const n = parseInt(p.postennummer.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(4, "0");
}

function naechsteBewegungsId() {
  let max = 0;
  zustand.bewegungen.forEach(function (b) {
    const n = parseInt(String(b.id).replace("B-", ""), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return "B-" + String(max + 1).padStart(4, "0");
}

function fuelleBeschreibungsListe() {
  const dl = document.getElementById("beschreibungsListe");
  dl.innerHTML = "";
  MODELL.beschreibungsVorauswahl.forEach(function (b) {
    const opt = document.createElement("option");
    opt.value = b;
    dl.appendChild(opt);
  });
}

function fuelleTeilenummerListe() {
  const dl = document.getElementById("teilenummerListe");
  dl.innerHTML = "";
  const kunde = zustand.eingang.kunde;
  const siehe = new Set();
  zustand.posten.forEach(function (p) {
    if (p.kunde === kunde && !siehe.has(p.teilenummer)) {
      siehe.add(p.teilenummer);
      const opt = document.createElement("option");
      opt.value = p.teilenummer;
      dl.appendChild(opt);
    }
  });
}

function farbcodeOptionenHtml(ausgewaehlt) {
  return MODELL.farbcodeRegelwerk.map(function (f) {
    const sel = f.farbcode === ausgewaehlt ? " selected" : "";
    return '<option value="' + f.farbcode + '"' + sel + ">" + f.farbcode + " – " + f.name + "</option>";
  }).join("");
}

function behaelterOptionenHtml(ausgewaehlt) {
  return BEHAELTERSTAMM.filter(function (b) { return !b.deaktiviert; })
    .slice()
    .sort(function (a, b) { return a.eingangsreihenfolge - b.eingangsreihenfolge; })
    .map(function (b) {
      const sel = b.behaeltercode === ausgewaehlt ? " selected" : "";
      return '<option value="' + b.behaeltercode + '"' + sel + ">" + b.behaeltercode + " – " + b.behaelterbeschreibung + "</option>";
    })
    .join("");
}

function eingangZeileHtml(pos, i) {
  const r1 = r1Abweichung(pos);
  const pruefung = r1
    ? '<span class="warn">⚠ ' + r1.stueckzahl + " ≠ " + r1.anzahl + " × " + r1.teile + " = " + r1.gerechnet + '</span><br><label class="trotzdem"><input type="checkbox" data-i="' + i + '" data-feld="r1Bestaetigt"' + (pos.r1Bestaetigt ? " checked" : "") + '> Trotzdem speichern</label>'
    : '<span class="ok">ok</span>';
  const retoure = pos.buchungsart === "Retoure"
    ? '<tr class="retoure-zeile" data-retoure="' + i + '"><td colspan="12">Retoure-Grund (Pflicht, R8): <select data-i="' + i + '" data-feld="retoureGrund"><option value="">bitte waehlen</option><option value="Nacharbeit"' + (pos.retoureGrund === "Nacharbeit" ? " selected" : "") + '>Nacharbeit</option><option value="Reklamation"' + (pos.retoureGrund === "Reklamation" ? " selected" : "") + '>Reklamation</option></select></td></tr>'
    : "";
  return '<tr data-i="' + i + '">'
    + '<td><select data-i="' + i + '" data-feld="buchungsart"><option value="Neuanlieferung"' + (pos.buchungsart === "Neuanlieferung" ? " selected" : "") + '>Neuanlieferung</option><option value="Retoure"' + (pos.buchungsart === "Retoure" ? " selected" : "") + '>Retoure</option></select></td>'
    + '<td><input type="text" data-i="' + i + '" data-feld="teilenummer" list="teilenummerListe" value="' + pos.teilenummer + '"></td>'
    + '<td><input type="text" data-i="' + i + '" data-feld="beschreibung" list="beschreibungsListe" value="' + pos.beschreibung + '"></td>'
    + '<td><select data-i="' + i + '" data-feld="farbcode"><option value="">-- waehlen --</option>' + farbcodeOptionenHtml(pos.farbcode) + "</select></td>"
    + '<td><input type="number" min="1" data-i="' + i + '" data-feld="stueckzahl" value="' + pos.stueckzahl + '"></td>'
    + '<td><select data-i="' + i + '" data-feld="behaeltertyp"><option value="">-- waehlen --</option>' + behaelterOptionenHtml(pos.behaeltertyp) + "</select></td>"
    + '<td><input type="number" min="1" data-i="' + i + '" data-feld="anzahlBehaelter" value="' + pos.anzahlBehaelter + '"></td>'
    + '<td><input type="number" min="0" data-i="' + i + '" data-feld="teileProBehaelter" value="' + pos.teileProBehaelter + '"></td>'
    + '<td><input type="text" data-i="' + i + '" data-feld="bestellnummer" value="' + pos.bestellnummer + '"></td>'
    + '<td><input type="text" data-i="' + i + '" data-feld="liefernummer" value="' + pos.liefernummer + '"></td>'
    + '<td class="pruefung">' + pruefung + "</td>"
    + '<td><button type="button" class="loeschen" data-i="' + i + '" title="Position loeschen">✕</button></td>'
    + "</tr>" + retoure;
}

function rendernEingang() {
  const kundeSelect = document.getElementById("eingangKunde");
  constalteWerte = kundeSelect.value;
  fuelleKundenSelect(kundeSelect, true);
  kundeSelect.value = zustand.eingang.kunde || constalteWerte;
  document.getElementById("eingangDatum").value = zustand.eingang.datum || heuteIso();
  fuelleBeschreibungsListe();
  fuelleTeilenummerListe();
  const tbody = document.getElementById("positionsKörper");
  tbody.innerHTML = "";
  zustand.eingang.positionen.forEach(function (pos, i) {
    tbody.innerHTML += eingangZeileHtml(pos, i);
  });
  tbody.querySelectorAll("input, select").forEach(function (el) {
    const i = parseInt(el.getAttribute("data-i"), 10);
    const feld = el.getAttribute("data-feld");
    if (feld === "r1Bestaetigt") {
      el.addEventListener("change", function () {
        zustand.eingang.positionen[i][feld] = el.checked;
      });
      return;
    }
    el.addEventListener("input", function () {
      let v = el.value;
      if (feld === "teilenummer") {
        v = v.toUpperCase();
        el.value = v;
      }
      zustand.eingang.positionen[i][feld] = v;
      aktualisierePruefung(i);
    });
    el.addEventListener("change", function () {
      zustand.eingang.positionen[i][feld] = el.value;
      if (feld === "buchungsart" || feld === "behaeltertyp") rendernEingang();
      else aktualisierePruefung(i);
    });
  });
  tbody.querySelectorAll(".loeschen").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const i = parseInt(btn.getAttribute("data-i"), 10);
      zustand.eingang.positionen.splice(i, 1);
      rendernEingang();
    });
  });
}

function aktualisierePruefung(i) {
  const pos = zustand.eingang.positionen[i];
  if (!pos) return;
  const tbody = document.getElementById("positionsKörper");
  const tr = tbody.querySelector('tr[data-i="' + i + '"]');
  if (!tr) return;
  const zelle = tr.querySelector(".pruefung");
  if (!zelle) return;
  const r1 = r1Abweichung(pos);
  zelle.innerHTML = r1
    ? '<span class="warn">⚠ ' + r1.stueckzahl + " ≠ " + r1.anzahl + " × " + r1.teile + " = " + r1.gerechnet + '</span><br><label class="trotzdem"><input type="checkbox" data-i="' + i + '" data-feld="r1Bestaetigt"' + (pos.r1Bestaetigt ? " checked" : "") + '> Trotzdem speichern</label>'
    : '<span class="ok">ok</span>';
  const cb = zelle.querySelector("input[data-feld='r1Bestaetigt']");
  if (cb) {
    cb.addEventListener("change", function () {
      pos.r1Bestaetigt = cb.checked;
    });
  }
}

function eingangSpeichern() {
  const kunde = zustand.eingang.kunde;
  const datum = document.getElementById("eingangDatum").value || zustand.eingang.datum;
  if (!kunde) {
    alert("Bitte Kunde im Kopffeld auswaehlen.");
    return;
  }
  if (!datum) {
    alert("Bitte Wareneingangsdatum setzen.");
    return;
  }
  zustand.eingang.datum = datum;
  const pos = zustand.eingang.positionen;
  if (pos.length === 0) {
    alert("Mindestens eine Position anlegen (\"+ Weitere Position\").");
    return;
  }
  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const fehlt = [];
    if (!p.teilenummer.trim()) fehlt.push("Teilenummer");
    if (p.farbcode.trim() === "") fehlt.push("Farbcode");
    if (p.stueckzahl === "" || isNaN(Number(p.stueckzahl)) || Number(p.stueckzahl) <= 0) fehlt.push("Stueckzahl (> 0)");
    if (!p.behaeltertyp) fehlt.push("Behaeltertyp");
    if (p.anzahlBehaelter === "" || isNaN(Number(p.anzahlBehaelter)) || Number(p.anzahlBehaelter) <= 0) fehlt.push("Anzahl Behaelter (> 0)");
    if (p.teileProBehaelter === "" || isNaN(Number(p.teileProBehaelter))) fehlt.push("Teile je Behaelter");
    if (p.buchungsart === "Retoure" && !p.retoureGrund) fehlt.push("Retoure-Grund");
    if (fehlt.length > 0) {
      alert("Position " + (i + 1) + ": Pflichtfeld(er) fehlen bzw. ungueltig: " + fehlt.join(", "));
      return;
    }
  }
  for (let i = 0; i < pos.length; i++) {
    const abw = r1Abweichung(pos[i]);
    if (abw && !pos[i].r1Bestaetigt) {
      alert("Position " + (i + 1) + ": Stueckzahl " + abw.stueckzahl + " weicht ab von Anzahl × Teile je Behaelter (" + abw.anzahl + " × " + abw.teile + " = " + abw.gerechnet + "). Bitte korrigieren oder Zeile mit \"Trotzdem speichern\" bestaetigen (R1).");
      return;
    }
  }
  const jahr = datum.slice(0, 4);
  const neu = [];
  pos.forEach(function (p) {
    const nr = naechstePostenNummer(jahr);
    const posten = {
      postennummer: nr,
      kunde: kunde,
      teilenummer: p.teilenummer.trim().toUpperCase(),
      beschreibung: p.beschreibung.trim(),
      stueckzahl: Number(p.stueckzahl),
      farbcode: p.farbcode.trim(),
      anzahlBehaelter: Number(p.anzahlBehaelter),
      behaeltertyp: p.behaeltertyp,
      teileProBehaelter: Number(p.teileProBehaelter),
      wareneingangsdatum: datum,
      bestellnummer: p.bestellnummer.trim(),
      liefernummer: p.liefernummer.trim(),
      warenausgangsdatum: null,
      status: "Rohteil",
      gesperrt: false,
      sperrgrund: "",
      produktionsdatum: null,
      buchungsart: p.buchungsart,
      retoureGrund: p.buchungsart === "Retoure" ? p.retoureGrund : ""
    };
    zustand.posten.push(posten);
    neu.push(nr);
    zustand.bewegungen.push({
      id: naechsteBewegungsId(),
      posten: nr,
      bewegungsart: posten.buchungsart === "Retoure" ? "Retoure" : "Wareneingang",
      datumUhrzeit: new Date().toISOString(),
      vorherWert: null,
      nachherWert: "Status Rohteil, " + posten.stueckzahl + " Stueck" + (posten.retoureGrund ? " (Retoure: " + posten.retoureGrund + ")" : ""),
      benutzer: BENUTZER
    });
  });
  speichereDaten();
  zustand.eingang = { kunde: "", datum: heuteIso(), positionen: [neuePosition()] };
  zeigeBestaetigung("Wareneingang gespeichert: " + neu.join(", ") + "  (" + neu.length + " Posten, Kunde " + kunde + ", " + formatDatum(datum) + ")");
  zeigeAnsicht("bestand");
}

function eingangVerbinden() {
  document.getElementById("navBestand").addEventListener("click", function () {
    document.getElementById("bestaetigung").hidden = true;
    zeigeAnsicht("bestand");
  });
  document.getElementById("wareneingang").addEventListener("click", function () {
    document.getElementById("bestaetigung").hidden = true;
    zeigeAnsicht("wareneingang");
  });
  document.getElementById("eingangKunde").addEventListener("change", function (e) {
    zustand.eingang.kunde = e.target.value;
    fuelleTeilenummerListe();
  });
  document.getElementById("eingangDatum").addEventListener("change", function (e) {
    zustand.eingang.datum = e.target.value;
  });
  document.getElementById("weiterePosition").addEventListener("click", function () {
    zustand.eingang.positionen.push(neuePosition());
    rendernEingang();
  });
  document.getElementById("eingangSpeichern").addEventListener("click", eingangSpeichern);
  document.getElementById("eingangAbbrechen").addEventListener("click", function () {
    zustand.eingang = { kunde: "", datum: heuteIso(), positionen: [neuePosition()] };
    zeigeAnsicht("bestand");
  });
}

function init() {
  ladeDaten();
  fuelleKundenSelect(document.getElementById("filterKunde"), false);
  fuelleStatusSelect(document.getElementById("filterStatus"));
  fuelleBehaelterSelect(document.getElementById("filterBehaeltertyp"));
  filterVerbinden();
  eingangVerbinden();
  rendern();
}

document.addEventListener("DOMContentLoaded", init);
