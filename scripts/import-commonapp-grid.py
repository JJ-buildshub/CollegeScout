#!/usr/bin/env python3
"""
Builds data/commonapp.json from Common App's public first-year requirements
grid (deadlines, application fees, fee waiver, personal essay, portfolio,
recommendations) for every school in data/colleges.json that is a Common App
member.

Usage:
    pip install --user pypdf
    python scripts/import-commonapp-grid.py <path-to-ReqGrid.pdf> [--updated 2026-09-18]

The PDF is public: https://content.commonapp.org/Files/ReqGrid.pdf (not stored
in this repo; re-download each cycle). Schools are matched by name, with the
explicit overrides below for names that differ. Anything unmatched is listed,
never guessed: UC, CSU and other non-members simply have no entry.

Only what the grid positively states is stored. A blank cell means "not
stated", NOT "no" (e.g. Northwestern requires the personal essay but its cell
is blank), so blanks are left out rather than turned into a negative.

Writes only data/commonapp.json. Never touches data/colleges.json. Also prints
a comparison of the grid against colleges.json (deadlines, test policy) so
disagreements can be reviewed by a person.
"""
import io
import json
import os
import re
import sys
from datetime import date

from pypdf import PdfReader

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

GRID_URL = "https://content.commonapp.org/Files/ReqGrid.pdf"

# Our college id -> the name the grid uses, where they differ.
NAME_OVERRIDES = {
    "california-institute-of-technology": "California Institute of Technology (Caltech)",
    "penn-state-university": "Penn State",
    "indiana-university-bloomington": "Indiana University Bloomington - Flagship Campus",
    "university-of-maryland": "University of Maryland",
    "rutgers-university": "Rutgers University",
    "miami-university-ohio": "Miami University (Ohio)",
    "new-york-university": "New York University",
}

COLS = ["type", "ED", "EDII", "EA", "EAII", "REA", "Rolling", "US", "Intl", "feeWaiver", "personalEssay",
        "coursesGrades", "portfolio", "writing", "testPolicy", "testsUsed", "english", "TE", "OE", "MR", "CR", "savesForms"]
HEAD_TOKENS = ["type", "ED", "EDII", "EA", "EAII", "REA", "Rolling", "US", "Int'l", "fee waiver", "essay", "Grades",
               "Portfolio", "Writing", "policy", "tests used", "proficiency", "TE", "OE", "MR", "CR", "forms"]


def header_centers(line):
    centers, pos = [], 0
    for tok in HEAD_TOKENS:
        i = line.find(tok, pos)
        if i == -1:
            raise ValueError(f"header token {tok!r} not found; the grid layout may have changed")
        centers.append(i + len(tok) / 2)
        pos = i + len(tok)
    return centers


def cells_of(line):
    # Cells are separated by 2+ spaces; single spaces stay inside a cell ("U.S. only").
    return [(m.start(), m.end(), m.group().strip()) for m in re.finditer(r"\S+(?: \S+)*", line)]


def parse_grid(path):
    reader = PdfReader(path)
    records = []
    for page_number, page in enumerate(reader.pages, start=1):
        lines = page.extract_text(extraction_mode="layout").splitlines()
        hdr = next((i for i, ln in enumerate(lines) if "Portfolio" in ln and "Writing" in ln), None)
        if hdr is None:
            continue
        centers = header_centers(lines[hdr])
        name_end = centers[0] - 4
        bounds = [(centers[i] + centers[i + 1]) / 2 for i in range(len(centers) - 1)]

        def col_of(cx):
            for i, b in enumerate(bounds):
                if cx < b:
                    return i
            return len(centers) - 1

        block = []

        def flush():
            if not block:
                return
            name_parts, cells, is_row = [], {}, False
            for ln in block:
                for s, e, t in cells_of(ln):
                    if e <= name_end + 8 and s < name_end:
                        name_parts.append(t)
                        continue
                    col = COLS[col_of((s + e) / 2)]
                    cells[col] = (cells.get(col, "") + " " + t).strip()
                    if col == "type" and t in ("Coed", "Women", "Men", "Coordinate"):
                        is_row = True
            if is_row:
                records.append({"name": re.sub(r"\s+", " ", " ".join(name_parts)).strip(), "page": page_number, **cells})
            block.clear()

        for ln in lines[hdr + 1:]:
            if ln.strip().startswith("NOTES"):
                break
            if not ln.strip():
                flush()
            else:
                block.append(ln)
        flush()
    return records


def norm(name):
    s = name.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\b(the|of|at|in)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def iso_date(text):
    """'11/1/2026' -> '2026-11-01'; 'Rolling' stays 'Rolling'; anything else is dropped."""
    if not text:
        return None
    if text.strip().lower() == "rolling":
        return "Rolling"
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", text.strip())
    if not m:
        return None
    return date(int(m.group(3)), int(m.group(1)), int(m.group(2))).isoformat()


def positive(cell):
    return True if cell == "Y" else None


def to_int(cell):
    return int(cell) if cell and cell.isdigit() else None


def build_entry(rec):
    deadlines = {k: iso_date(rec.get(k)) for k in ("ED", "EDII", "EA", "EAII", "REA")}
    deadlines["RD"] = iso_date(rec.get("Rolling"))
    portfolio = {"SR": "SlideRoom", "COL": "The school's own system"}.get(rec.get("portfolio", ""))
    entry = {
        "gridName": rec["name"],
        "deadlines": {k: v for k, v in deadlines.items() if v},
        "feeUS": rec.get("US") or None,
        "feeIntl": rec.get("Intl") or None,
        "feeWaiver": rec.get("feeWaiver") or None,
        "personalEssayRequired": positive(rec.get("personalEssay")),
        "coursesGradesRequired": positive(rec.get("coursesGrades")),
        "portfolio": portfolio,
        "teacherEvaluations": to_int(rec.get("TE")),
        "otherEvaluations": to_int(rec.get("OE")),
        "counselorRecommendation": positive(rec.get("CR")),
        "midYearReport": positive(rec.get("MR")),
        "testPolicyCode": rec.get("testPolicy") or None,
    }
    return {k: v for k, v in entry.items() if v not in (None, {})}


def main():
    args = sys.argv[1:]
    path = next((a for a in args if not a.startswith("--")), None)
    if not path:
        print(__doc__)
        sys.exit(1)
    updated = args[args.index("--updated") + 1] if "--updated" in args else "2026-09-18"

    records = parse_grid(path)
    by_name = {}
    for rec in records:
        by_name.setdefault(norm(rec["name"]), rec)
    print(f"Parsed {len(records)} colleges from the grid.")

    colleges = json.load(open(os.path.join(ROOT, "data", "colleges.json"), encoding="utf-8"))
    by_college, unmatched = {}, []
    for c in colleges:
        rec = by_name.get(norm(NAME_OVERRIDES.get(c["id"], c["name"])))
        if rec:
            by_college[c["id"]] = build_entry(rec)
        else:
            unmatched.append(c["id"])

    out = {
        "source": {
            "name": "Common App first-year deadlines, fees and requirements (2026-27)",
            "url": GRID_URL,
            "updated": updated,
        },
        "note": "Only what the grid positively states. A blank grid cell means not stated, not no.",
        "byCollege": by_college,
    }
    with open(os.path.join(ROOT, "data", "commonapp.json"), "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"Wrote data/commonapp.json: {len(by_college)} of {len(colleges)} schools matched.")
    print("Not in the grid (not Common App members, or a name to add to NAME_OVERRIDES):")
    print("  " + ", ".join(unmatched))

    # ---- review report: grid vs colleges.json ----
    code_ok = {
        "A": {"Test-Required"},
        "F": {"Test-Optional", "Test-Required"},
        "I": {"Test-Blind", "Test-Free"},
        "N": {"Test-Optional", "Test-Free", "Test-Blind"},
        "S": {"Test-Optional", "Test-Required"},
    }
    print("\nREVIEW: test policy in colleges.json vs the grid's policy code")
    for c in colleges:
        e = by_college.get(c["id"])
        code = e.get("testPolicyCode") if e else None
        if code and c["testingPolicy"] not in code_ok[code]:
            print(f"  {c['name']}: colleges.json says {c['testingPolicy']}; grid code {code}")

    def md(text):
        m = re.match(r"([A-Za-z]+)\s+(\d+)", text or "")
        return (m.group(1)[:3].lower(), int(m.group(2))) if m else None

    print("\nREVIEW: regular-decision deadline in colleges.json vs the grid (month and day)")
    months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    for c in colleges:
        e = by_college.get(c["id"])
        grid_rd = e.get("deadlines", {}).get("RD") if e else None
        ours = next((p["deadline"] for p in c["applicationPlans"] if p["type"] == "RD"), None)
        if not grid_rd or grid_rd == "Rolling" or not ours:
            continue
        g = date.fromisoformat(grid_rd)
        o = md(ours)
        if o is None or o != (months[g.month - 1], g.day):
            print(f"  {c['name']}: colleges.json says {ours}; grid says {g.strftime('%B')} {g.day}")


if __name__ == "__main__":
    main()
