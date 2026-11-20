#!/usr/bin/env python3
"""Behaelterstamm aus Behaelter.xlsx (Blatt "Daten") nach js/behaelterstamm.js importieren.

Aufruf im Projektordner:
    python tools/behaelter-import.py Behaelter.xlsx
    python tools/behaelter-import.py --aus-planung        # ohne Excel, aus der Planung

Beim Import werden die bekannten Tippfehler im Blatt bereinigt
(Spaltentitel "Behaetercode" -> "Behaeltercode", "Ausatzrahmen" -> "Aufsatzrahmen"),
die Codes selbst bleiben unveraendert.
"""
import argparse
import json
import os
import re
import sys

ANZEIGEREIHENFOLGE = [
    "SLT",
    "IMD244285", "IMD244286", "IMD247938", "IMD524185", "IMD526852", "IMD557135", "IMD78213",
    "RDL", "RBD", "RBC",
    "EWP", "PKC", "PKA", "PK8", "PK6", "PK4", "PK2",
    "GKA",
    "GK4",
    "SK8",
    "SJ6",
    "SJ3",
    "SF2", "SD2",
    "KH4", "KH3", "KH2", "KE3", "KE2", "KC2",
    "Karton",
    "WK9",
    "Holzbox",
]

EINGANGSREIHENFOLGE = [
    "GKA",
    "GK4",
    "SJ6",
    "SJ3",
    "KH4", "KH3", "KH2", "KE3", "KE2", "KC2",
    "EWP", "PKC", "PKA", "PK8", "PK6", "PK4", "PK2",
    "RDL", "RBD", "RBC",
    "IMD247938", "IMD524185", "IMD526852", "IMD557135", "IMD78213", "IMD244286", "IMD244285",
    "SLT",
    "SK8",
    "SF2", "SD2",
    "Karton",
    "WK9",
    "Holzbox",
]

BESCHREIBUNGEN_AUS_PLANUNG = {
    "SLT": "Sonderladungstraeger",
    "IMD244285": "Sondergestell IMD244285",
    "IMD244286": "Sondergestell IMD244286",
    "IMD247938": "Sondergestell IMD247938",
    "IMD524185": "Sondergestell IMD524185",
    "IMD526852": "Sondergestell IMD526852",
    "IMD557135": "Sondergestell IMD557135",
    "IMD78213": "Sondergestell IMD78213",
    "RDL": "Hoernerbockgestell RDL",
    "RBD": "Hoernerbockgestell RBD",
    "RBC": "Hoernerbockgestell RBC",
    "EWP": "Einwegpalette",
    "PKC": "Palette PKC",
    "PKA": "Palette PKA",
    "PK8": "Palette PK8",
    "PK6": "Palette PK6",
    "PK4": "Palette PK4",
    "PK2": "Europalette mit Aufsatzrahmen",
    "GKA": "Gitterbox",
    "GK4": "halbe Gitterbox",
    "SK8": "ganzer Stahlbehaelter",
    "SJ6": "Stahlbehaelter mit Klappe SJ6",
    "SJ3": "Stahlbehaelter mit Klappe SJ3",
    "SF2": "Schaeferkasten SF2",
    "SD2": "Schaeferkasten SD2",
    "KH4": "Kleinladungstraeger 6422",
    "KH3": "Kleinladungstraeger KH3",
    "KH2": "Kleinladungstraeger KH2",
    "KE3": "Kleinladungstraeger KE3",
    "KE2": "Kleinladungstraeger KE2",
    "KC2": "Kleinladungstraeger KC2",
    "Karton": "Karton",
    "WK9": "WWL Mehrwegbehaelter",
    "Holzbox": "Holzbox",
}

Tippfehler_Bereinigen = {
    "Behaetercode": "Behaeltercode",
    "Ausatzrahmen": "Aufsatzrahmen",
}


def bereinigen(text):
    if text is None:
        return ""
    text = str(text).strip()
    for falsch, richtig in Tippfehler_Bereinigen.items():
        text = text.replace(falsch, richtig)
    return text


def aus_planung():
    return {code: BESCHREIBUNGEN_AUS_PLANUNG[code] for code in ANZEIGEREIHENFOLGE}


def aus_xlsx(pfad):
    try:
        from openpyxl import load_workbook
    except ImportError:
        sys.exit("openpyxl fehlt: bitte 'pip install openpyxl' ausfuehren.")
    wb = load_workbook(pfad, data_only=True)
    if "Daten" not in wb.sheetnames:
        sys.exit("Blatt 'Daten' nicht gefunden. Vorhanden: " + ", ".join(wb.sheetnames))
    blatt = wb["Daten"]
    kopf = None
    for zeile in blatt.iter_rows(values_only=True):
        werte = [bereinigen(z) for z in zeile]
        if "Behaeltercode" in werte and any("eschreibung" in w for w in werte):
            kopf = werte
            break
    if kopf is None:
        sys.exit("Kopfzeile mit 'Behaeltercode' und '...beschreibung' nicht gefunden.")
    sp_code = kopf.index("Behaeltercode")
    sp_beschr = next(i for i, w in enumerate(kopf) if "eschreibung" in w)
    ergebnis = {}
    for zeile in blatt.iter_rows(values_only=True):
        code = bereinigen(zeile[sp_code] if sp_code < len(zeile) else None)
        beschr = bereinigen(zeile[sp_beschr] if sp_beschr < len(zeile) else None)
        if code:
            ergebnis[code] = beschr or code
    fehlt = [c for c in ANZEIGEREIHENFOLGE if c not in ergebnis]
    if fehlt:
        sys.exit("Folgende Codes fehlen im Blatt 'Daten': " + ", ".join(fehlt))
    return ergebnis


def stamm_aufbauen(beschreibungen):
    anzeige = {code: i + 1 for i, code in enumerate(ANZEIGEREIHENFOLGE)}
    eingang = {code: i + 1 for i, code in enumerate(EINGANGSREIHENFOLGE)}
    return [
        {
            "behaeltercode": code,
            "behaelterbeschreibung": beschreibungen.get(code, code),
            "anzeigereihenfolge": anzeige[code],
            "eingangsreihenfolge": eingang[code],
            "deaktiviert": False,
        }
        for code in ANZEIGEREIHENFOLGE
    ]


def nach_js(stamm, ziel_pfad):
    js = (
        "const BEHAELTERSTAMM = "
        + json.dumps(stamm, ensure_ascii=False, indent=2)
        + ";\n"
    )
    with open(ziel_pfad, "w", encoding="utf-8") as f:
        f.write(js)


def main():
    parser = argparse.ArgumentParser(description="Behaelterstamm importieren")
    parser.add_argument("xlsx", nargs="?", help="Pfad zu Behaelter.xlsx")
    parser.add_argument("--aus-planung", action="store_true", help="ohne Excel aus der Planung erzeugen")
    args = parser.parse_args()
    if args.aus_planung or not args.xlsx:
        beschreibungen = aus_planung()
    else:
        beschreibungen = aus_xlsx(args.xlsx)
    stamm = stamm_aufbauen(beschreibungen)
    ziel = os.path.join(os.path.dirname(__file__), "..", "js", "behaelterstamm.js")
    nach_js(stamm, os.path.normpath(ziel))
    print(f"{len(stamm)} Behaeltertypen geschrieben nach {os.path.normpath(ziel)}")


if __name__ == "__main__":
    main()
