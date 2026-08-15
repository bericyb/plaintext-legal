"""Create a compact, source-attributed SBIR award snapshot for offline matching.

The input is the official SBA award CSV linked from SBIR.gov Data Resources.
The generated TypeScript module includes only public award-level fields useful for
matching and historical context; it excludes personal contact details.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen

SOURCE_URL = "https://data.www.sbir.gov/awarddatapublic/award_data.csv"
DESTINATION = Path("server/data/sbirSnapshot.ts")

KEYWORDS = {
    "health": ["health", "clinical", "hospital", "nurse", "medical", "biomedical"],
    "cyber": ["cyber", "security", "threat", "network defense"],
    "climate": ["water", "climate", "environment", "energy", "emission"],
    "aerospace": ["aerospace", "aircraft", "space", "composite", "manufacturing"],
    "workforce": ["workforce", "education", "training", "learning", "youth"],
}


def normalize(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def first(row: dict[str, str], *names: str) -> str:
    lowered = {key.lower(): value for key, value in row.items()}
    for name in names:
        if name.lower() in lowered:
            return normalize(lowered[name.lower()])
    return ""


def as_amount(value: str) -> float:
    try:
        return float(value.replace("$", "").replace(",", ""))
    except ValueError:
        return 0


def relevant(text: str) -> bool:
    lower = text.lower()
    return any(term in lower for group in KEYWORDS.values() for term in group)


def main() -> None:
    print("Downloading the official SBIR award data…", file=sys.stderr)
    with urlopen(SOURCE_URL, timeout=120) as response:
        lines = (line.decode("utf-8", errors="replace") for line in response)
        reader = csv.DictReader(lines)
        selected: list[dict[str, object]] = []
        seen: set[str] = set()
        for row in reader:
            title = first(row, "award_title", "Award Title")
            abstract = first(row, "abstract", "Abstract")
            combined = f"{title} {abstract}"
            year = first(row, "award_year", "Award Year")
            if not title or not relevant(combined) or year < "2020":
                continue
            award_id = first(row, "agency_tracking_number", "Agency Tracking Number", "contract", "Contract")
            unique = award_id or f"{title}|{year}"
            if unique in seen:
                continue
            seen.add(unique)
            selected.append(
                {
                    "id": unique,
                    "title": title[:240],
                    "agency": first(row, "agency", "Agency"),
                    "program": first(row, "program", "Program"),
                    "phase": first(row, "phase", "Phase"),
                    "year": year,
                    "amount": as_amount(first(row, "award_amount", "Award Amount")),
                    "recipient": first(row, "firm", "Firm"),
                    "state": first(row, "state", "State"),
                    "keywords": first(row, "research_area_keywords", "Research Area Keywords")[:500],
                    "abstract": abstract[:900],
                    "sourceUrl": "https://www.sbir.gov/data-resources",
                }
            )
            if len(selected) >= 80:
                break

    payload = json.dumps(selected, ensure_ascii=False, indent=2)
    content = (
        "// Generated from the official SBIR.gov award data. Run scripts/build_sbir_snapshot.py to refresh.\n"
        "export type SbirSnapshotAward = {\n"
        "  id: string; title: string; agency: string; program: string; phase: string; year: string;\n"
        "  amount: number; recipient: string; state: string; keywords: string; abstract: string; sourceUrl: string;\n"
        "};\n\n"
        f"export const sbirSnapshot: SbirSnapshotAward[] = {payload} as SbirSnapshotAward[];\n"
    )
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(content, encoding="utf-8")
    print(f"Wrote {len(selected)} public SBIR award records to {DESTINATION}", file=sys.stderr)


if __name__ == "__main__":
    main()
