"""Write data/curseforge.json with the download counts of my mods.

Runs in GitHub Actions (.github/workflows/curseforge.yml). The API key comes from the
repository secret CF_API_KEY, so it never appears in the website's JavaScript.

Run locally:  CF_API_KEY=... python tools/curseforge_stats.py
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "curseforge.json"
# boat-fix, underwater-torch, all-stacks-to-67, place-on-path
MOD_IDS = [1286312, 1539858, 1532694, 1586696]


def main():
    key = os.environ.get("CF_API_KEY")
    if not key:
        sys.exit("CF_API_KEY fehlt (GitHub: Settings → Secrets and variables → Actions).")
    mods = {}
    for mod_id in MOD_IDS:
        req = urllib.request.Request(f"https://api.curseforge.com/v1/mods/{mod_id}",
                                     headers={"x-api-key": key, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())["data"]
        mods[str(mod_id)] = {"name": data["name"], "downloads": data["downloadCount"]}
    total = sum(m["downloads"] for m in mods.values())

    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    if old.get("mods") == mods:
        print("Keine Änderung:", total)
        return
    OUT.write_text(json.dumps({"fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                               "total": total, "mods": mods}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Gespeichert:", total)


if __name__ == "__main__":
    main()
