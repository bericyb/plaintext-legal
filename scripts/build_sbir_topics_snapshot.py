"""Create a small snapshot of currently open SBIR/STTR topics from SBIR.gov.

The live SBIR API is documented as under maintenance. This script is a
reproducible, source-attributed fallback that reads SBIR.gov's public topics
page and preserves only topic-level opportunity metadata and excerpts.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

DESTINATION = Path("server/data/sbirTopicsSnapshot.ts")
SEARCHES = ["health", "artificial intelligence", "cybersecurity", "water", "manufacturing", "workforce"]


def tidy(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def main() -> None:
    records: list[dict[str, str]] = []
    seen: set[str] = set()
    for term in SEARCHES:
        url = "https://www.sbir.gov/topics?" + urlencode({"keywords": term, "status": "Open", "page": 0})
        request = Request(url, headers={"User-Agent": "PlainTextLegalResearchBot/1.0"})
        with urlopen(request, timeout=30) as response:
            soup = BeautifulSoup(response.read(), "html.parser")
        for heading in soup.select("h2, h3"):
            title = tidy(heading.get_text(" ", strip=True))
            if not title or title.lower() in {"search open topics", "filter results", "pagination"}:
                continue
            container = heading.find_parent(["article", "div", "li"])
            excerpt = tidy(container.get_text(" ", strip=True) if container else "")
            if len(excerpt) < 60:
                continue
            identifier = title.lower()
            if identifier in seen:
                continue
            seen.add(identifier)
            records.append({
                "title": title[:280],
                "excerpt": excerpt[:1200],
                "query": term,
                "sourceUrl": url,
            })
            if len(records) >= 60:
                break
        if len(records) >= 60:
            break

    content = (
        "// Generated from SBIR.gov's public open-topic pages. Run scripts/build_sbir_topics_snapshot.py to refresh.\n"
        "export type SbirSnapshotTopic = { title: string; excerpt: string; query: string; sourceUrl: string };\n\n"
        f"export const sbirTopicsSnapshot: SbirSnapshotTopic[] = {json.dumps(records, ensure_ascii=False, indent=2)} as SbirSnapshotTopic[];\n"
    )
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(content, encoding="utf-8")
    print(f"Wrote {len(records)} public SBIR topic records to {DESTINATION}")


if __name__ == "__main__":
    main()
