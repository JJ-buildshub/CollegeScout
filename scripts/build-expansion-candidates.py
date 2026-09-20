#!/usr/bin/env python3
"""
Builds the candidate list for adding schools to CollegeScout, from public IPEDS files.
It never touches data/colleges.json: it writes expansion/candidates.csv and
expansion/summary.md for review, and a school only joins the directory after approval.

Inputs (unzipped IPEDS Data Center files, 2023 collection):
  HD2023.csv    institutional characteristics (name, state, control, level)
  ADM2023.csv   admissions (applicants, admitted, SAT/ACT)
  EF2023A.csv   fall enrollment
  C2023_A.csv   completions (bachelor's degrees by field)

    python scripts/build-expansion-candidates.py <folder with the four csv files>

Selection rules are in LAYERS below. Every number in the output is from these files;
nothing is estimated. Selectivity band comes from admitted / applicants.
"""
import csv
import io
import json
import os
import sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Same field -> CIP prefixes as scripts/import-programs.mjs
FIELDS = {
    "business": ["52"], "entrepreneurship": ["52.07"], "health": ["51"], "nursing": ["51.38"],
    "computing": ["11"], "data-science": ["30.70", "30.71", "27.05"], "education": ["13"],
    "kinesiology": ["31.05", "26.0908"], "performing-arts": ["50.03", "50.05", "50.09"],
    "visual-arts": ["50.04", "50.06", "50.07"], "architecture": ["04"], "engineering": ["14"],
}


def read(folder, *names):
    for n in names:
        p = os.path.join(folder, n)
        if os.path.exists(p):
            return csv.DictReader(open(p, encoding="utf-8-sig", errors="replace", newline=""))
    raise SystemExit(f"missing {names} in {folder}")


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def band(rate):
    if rate is None:
        return "unreported"
    if rate < 0.15:
        return "highly selective"
    if rate < 0.40:
        return "selective"
    if rate < 0.65:
        return "moderately selective"
    return "broadly accessible"


def main():
    folder = sys.argv[1]
    existing = json.load(open(os.path.join(ROOT, "data", "colleges.json"), encoding="utf-8"))
    have = {str(c["ipedsUnitId"]) for c in existing if c.get("ipedsUnitId")}
    have_by_state = defaultdict(int)
    for c in existing:
        have_by_state[c["state"]] += 1

    schools = {}
    for r in read(folder, "hd2023.csv", "HD2023.csv"):
        # 4-year degree-granting, public or private non-profit, still open, offers undergraduate degrees
        if r["ICLEVEL"] != "1" or r["CONTROL"] not in ("1", "2") or r["UGOFFER"] != "1" or r["DEGGRANT"] != "1":
            continue
        if r.get("CYACTIVE") not in ("1", None, ""):
            continue
        if r["UNITID"] in have or r["STABBR"] in ("PR", "GU", "VI", "AS", "MP", "FM", "MH", "PW"):
            continue
        schools[r["UNITID"]] = {
            "unitid": r["UNITID"], "name": r["INSTNM"], "city": r["CITY"], "state": r["STABBR"],
            "control": "Public" if r["CONTROL"] == "1" else "Private", "web": r["WEBADDR"],
            "landgrant": r["LANDGRNT"] == "1", "hbcu": r["HBCU"] == "1", "tribal": r["TRIBAL"] == "1",
        }
    for r in read(folder, "adm2023.csv", "ADM2023.csv"):
        s = schools.get(r["UNITID"])
        if not s:
            continue
        a, d = num(r["APPLCN"]), num(r["ADMSSN"])
        s["applicants"], s["admitted"] = a, d
        s["admit_rate"] = round(d / a, 4) if a and d is not None and a > 0 else None
        sat25 = (num(r["SATVR25"]), num(r["SATMT25"]))
        sat75 = (num(r["SATVR75"]), num(r["SATMT75"]))
        s["sat25"] = int(sat25[0] + sat25[1]) if None not in sat25 else None
        s["sat75"] = int(sat75[0] + sat75[1]) if None not in sat75 else None
    for r in read(folder, "ef2023a.csv", "EF2023A.csv"):
        s = schools.get(r["UNITID"])
        # EFALEVEL 2 = all students, undergraduate total
        if s and r["EFALEVEL"].strip() == "2":
            s["ug"] = num(r["EFTOTLT"])
    deg = defaultdict(lambda: defaultdict(float))
    total_deg = defaultdict(float)
    for r in read(folder, "C2023_a.csv", "C2023_A.csv"):
        if r["AWLEVEL"] != "5" or r["UNITID"] not in schools:
            continue
        n = num(r["CTOTALT"]) or 0
        code = r["CIPCODE"].strip()
        if code.startswith("99"):
            continue
        total_deg[r["UNITID"]] += n
        for f, prefixes in FIELDS.items():
            if any(code == p or code.startswith(p if "." in p else p + ".") for p in prefixes):
                deg[r["UNITID"]][f] += n
    for u, s in schools.items():
        s["degrees"] = {f: int(deg[u].get(f, 0)) for f in FIELDS}
        s["total_degrees"] = int(total_deg.get(u, 0))
        s["ug"] = int(s.get("ug") or 0)
        s["band"] = band(s.get("admit_rate"))
        s["layers"] = []

    pool = [s for s in schools.values() if s["ug"] >= 1500 and s["total_degrees"] >= 200]
    chosen = {}

    def pick(layer, candidates, limit, per_state=None, key=None):
        n, seen = 0, defaultdict(int)
        for s in candidates:
            if n >= limit:
                break
            if per_state and seen[s["state"]] >= per_state:
                continue
            seen[s["state"]] += 1
            s["layers"].append(layer)
            chosen[s["unitid"]] = s
            n += 1

    QUOTAS = (("highly selective", 0.20), ("mid", 0.35), ("accessible", 0.30), ("specialist", 0.15))

    def bucket(s):
        b = s["band"]
        if s["ug"] < 3000 and b != "highly selective":
            return "specialist"
        if b == "highly selective":
            return "highly selective"
        if b in ("selective", "moderately selective"):
            return "mid"
        return "accessible"

    def pick_mix(layer, candidates, limit, per_state=2):
        """Choose `limit` schools from `candidates` (already ranked) aiming for the 20/35/30/15 mix.
        A bucket with too few candidates hands its spare places to the others; nothing is invented."""
        by = defaultdict(list)
        for s in candidates:
            by[bucket(s)].append(s)
        want = {name: round(limit * share) for name, share in QUOTAS}
        taken, seen = [], defaultdict(int)
        def take(name, n):
            for s in by[name]:
                if n <= 0:
                    break
                if s in taken or (per_state and seen[s["state"]] >= per_state):
                    continue
                taken.append(s)
                seen[s["state"]] += 1
                n -= 1
            return n
        spare = 0
        for name, _ in QUOTAS:
            spare += take(name, want[name])
        for name, _ in QUOTAS:
            if spare <= 0:
                break
            spare = take(name, spare)
        for s in taken:
            s["layers"].append(layer)
            chosen[s["unitid"]] = s

    # A: big public universities (flagships and high-demand regionals), by undergraduate enrollment
    pub = sorted([s for s in pool if s["control"] == "Public" and s["ug"] >= 7000], key=lambda s: -s["ug"])
    pick("A public flagship/regional", pub, 70, per_state=3)

    # B: data science, architecture, entrepreneurship, kinesiology: most degrees awarded
    for f, mn, lim in (("data-science", 10, 20), ("architecture", 15, 20), ("entrepreneurship", 10, 20), ("kinesiology", 50, 20)):
        c = sorted([s for s in pool if s["degrees"][f] >= mn], key=lambda s: -s["degrees"][f])
        pick_mix(f"B {f}", c, lim)

    # C: nursing, allied health, education
    for f, mn, lim in (("nursing", 40, 18), ("health", 100, 14), ("education", 100, 14)):
        c = sorted([s for s in pool if s["degrees"][f] >= mn], key=lambda s: -s["degrees"][f])
        pick_mix(f"C {f}", c, lim)

    # D: music, art, design and film specialists (most arts degrees, plus schools where arts dominate)
    arts = lambda s: s["degrees"]["performing-arts"] + s["degrees"]["visual-arts"]
    c = sorted([s for s in schools.values() if s["ug"] >= 300 and s["total_degrees"] >= 60 and arts(s) >= 40], key=lambda s: -(arts(s) / max(s["total_degrees"], 1)))
    pick("D arts specialist", c, 14)
    for f in ("performing-arts", "visual-arts"):
        c = sorted([s for s in pool if s["degrees"][f] >= 40], key=lambda s: -s["degrees"][f])
        pick_mix(f"D {f}", c, 10)

    # E: geographic gaps: states that would still have fewer than 4 schools
    per_state_now = defaultdict(int)
    for c in existing:
        per_state_now[c["state"]] += 1
    for s in chosen.values():
        per_state_now[s["state"]] += 1
    gap_states = sorted({s["state"] for s in pool if per_state_now[s["state"]] < 4})
    for st in gap_states:
        c = sorted([s for s in pool if s["state"] == st], key=lambda s: -s["ug"])
        for s in c:
            if per_state_now[st] >= 4:
                break
            s["layers"].append("E geographic gap")
            if s["unitid"] not in chosen:
                per_state_now[st] += 1
            chosen[s["unitid"]] = s

    # F: selective or distinctive schools missing from the original list
    c = sorted([s for s in pool if s.get("admit_rate") is not None and s["admit_rate"] < 0.40 and (s.get("applicants") or 0) >= 2500],
               key=lambda s: -(s["sat75"] or 0))
    pick("F selective or distinctive", c, 22)

    out = sorted(chosen.values(), key=lambda s: (s["state"], s["name"]))
    os.makedirs(os.path.join(ROOT, "expansion"), exist_ok=True)
    cols = ["unitid", "name", "city", "state", "control", "band", "admit_rate", "applicants", "sat25", "sat75", "ug"]
    with open(os.path.join(ROOT, "expansion", "candidates.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols + ["layers"] + [f"degrees_{k}" for k in FIELDS] + ["website"])
        for s in out:
            w.writerow([s.get(k, "") for k in cols] + ["; ".join(s["layers"])] + [s["degrees"][k] for k in FIELDS] + [s["web"]])

    bands = defaultdict(int)
    for s in out:
        bands[s["band"]] += 1
    by_layer = defaultdict(int)
    for s in out:
        for l in set(x.split(" ")[0] for x in s["layers"]):
            by_layer[l] += 1
    layer_band = defaultdict(lambda: defaultdict(int))
    for s in out:
        for l in set(x.split(" ")[0] for x in s["layers"]):
            layer_band[l][s["band"]] += 1
    supply = defaultdict(int)
    for s in pool:
        supply[s["band"]] += 1
    states = defaultdict(int)
    for c in existing:
        states[c["state"]] += 1
    for s in out:
        states[s["state"]] += 1
    lines = [
        "# Expansion candidates (not added to the directory)", "",
        f"{len(out)} new schools from IPEDS 2023 files, on top of {len(existing)} existing: {len(existing) + len(out)} total.", "",
        "## By layer (a school can be in more than one)", *[f"- {k}: {v}" for k, v in sorted(by_layer.items())], "",
        "## Selectivity mix of the new schools (admit rate = admitted / applicants)",
        *[f"- {k}: {v} ({round(100 * v / len(out))}%)" for k, v in sorted(bands.items(), key=lambda x: -x[1])], "",
        "## Selectivity mix inside each layer",
        *[f"- {l}: " + ", ".join(f"{k} {v}" for k, v in sorted(layer_band[l].items(), key=lambda x: -x[1])) for l in sorted(layer_band)], "",
        "## Supply: eligible schools not already in the directory (4-year, 1,500+ undergraduates)",
        ", ".join(f"{k} {v}" for k, v in sorted(supply.items(), key=lambda x: -x[1])), "",
        "## Schools per state after adding (existing plus new)", ", ".join(f"{k} {v}" for k, v in sorted(states.items())), "",
        f"States and DC with no school: {sorted(set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split()) - set(states))}",
    ]
    open(os.path.join(ROOT, "expansion", "summary.md"), "w", encoding="utf-8", newline="").write("\n".join(lines) + "\n")
    print("\n".join(lines[:16]))


if __name__ == "__main__":
    main()
