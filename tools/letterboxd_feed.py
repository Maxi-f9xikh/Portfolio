"""Turn the public Letterboxd RSS feed into data/letterboxd-feed.json.

Runs every 30 minutes in GitHub Actions (.github/workflows/letterboxd.yml).
dashboard.js merges these entries on top of data/dashboard.json, so new
ratings and reviews show up without rebuilding or uploading anything.

Run:  python tools/letterboxd_feed.py
"""
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

LB_USER = "maxxi187"
OUT = Path(__file__).resolve().parent.parent / "data" / "letterboxd-feed.json"
NS = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}


def review_text(description):
    """The feed's description holds the poster plus either the review or 'Watched on …'."""
    paragraphs = re.findall(r"<p>(.*?)</p>", description or "", re.S)
    text = []
    for p in paragraphs:
        if "<img" in p:
            continue
        p = html.unescape(re.sub(r"<br\s*/?>", "\n", p))
        p = re.sub(r"<[^>]+>", "", p).strip()
        if not p or re.match(r"^(Re)?[Ww]atched on ", p) or p == "This review may contain spoilers.":
            continue
        text.append(p)
    return "\n\n".join(text) or None


def fetch():
    req = urllib.request.Request(f"https://letterboxd.com/{LB_USER}/rss/",
                                 headers={"User-Agent": "maximilianstickel.de dashboard"})
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    entries = []
    for it in root.iter("item"):
        title = it.findtext("letterboxd:filmTitle", namespaces=NS)
        if not title:
            continue  # list updates etc.
        rating = it.findtext("letterboxd:memberRating", namespaces=NS)
        year = it.findtext("letterboxd:filmYear", namespaces=NS)
        entries.append({
            "title": title,
            "year": int(year) if year else None,
            "tmdb": int(it.findtext("tmdb:movieId", namespaces=NS) or 0) or None,
            "date": it.findtext("letterboxd:watchedDate", namespaces=NS),
            "rating": float(rating) if rating else None,
            "rewatch": it.findtext("letterboxd:rewatch", namespaces=NS) == "Yes",
            "liked": it.findtext("letterboxd:memberLike", namespaces=NS) == "Yes",
            "review": review_text(it.findtext("description")),
        })
    return entries


def main():
    entries = fetch()
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    if old.get("entries") == entries:
        print("Keine neuen Einträge.")
        return
    OUT.write_text(json.dumps({"fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                               "entries": entries}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(entries)} Einträge gespeichert, neuester: {entries[0]['title'] if entries else '-'}")


if __name__ == "__main__":
    main()
