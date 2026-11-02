"""Build data/dashboard.json for dashboard.html.

Inputs (raw, not published):
  data/serializd.json          – Serializd export (diary + show lists)
  data/letterboxd/*.csv        – Letterboxd data export
  Letterboxd RSS               – newest diary entries (fetched live)
Output (published):
  data/dashboard.json          – everything the page needs
  data/reviews.json            – review texts, loaded on demand

Run:  python tools/build_dashboard.py
"""
import csv
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = DATA / "cache"
LB_USER = "maxxi187"
REGION = "DE"
# Matched case-insensitively against TMDB provider names for the region
MY_SERVICES = {"netflix": "Netflix", "disney plus": "Disney+", "hbo max": "HBO Max", "wow": "WOW"}

TMDB_KEY = re.search(r"TMDB_API_KEY\s*=\s*'([0-9a-f]{32})'",
                     (ROOT / "js" / "tmdb-config.js").read_text(encoding="utf-8")).group(1)


# ── TMDB ─────────────────────────────────────────
def tmdb(path, cache_key=None, max_age_days=None, **params):
    """GET a TMDB v3 endpoint, cached on disk under data/cache/."""
    cache_file = CACHE / f"{cache_key}.json" if cache_key else None
    if cache_file and cache_file.exists():
        fresh = max_age_days is None or (time.time() - cache_file.stat().st_mtime) < max_age_days * 86400
        if fresh:
            return json.loads(cache_file.read_text(encoding="utf-8"))
    params = {"api_key": TMDB_KEY, "language": "en-US", **params}
    url = f"https://api.themoviedb.org/3{path}?{urllib.parse.urlencode(params)}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                data = None
                break
            if e.code == 429 or e.code >= 500:
                time.sleep(1 + attempt * 2)
                continue
            raise
        except urllib.error.URLError:
            time.sleep(1 + attempt * 2)
    else:
        raise RuntimeError(f"TMDB request failed: {path}")
    if cache_file:
        cache_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def pmap(fn, items, workers=8):
    with ThreadPoolExecutor(workers) as ex:
        return list(ex.map(fn, items))


# ── LETTERBOXD ───────────────────────────────────
def read_csv(name):
    path = DATA / "letterboxd" / f"{name}.csv"
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def letterboxd_rss():
    """Newest diary entries with TMDB ids (the CSV export has none)."""
    try:
        req = urllib.request.Request(f"https://letterboxd.com/{LB_USER}/rss/",
                                     headers={"User-Agent": "maximilianstickel.de dashboard"})
        with urllib.request.urlopen(req, timeout=20) as r:
            root = ET.fromstring(r.read())
    except Exception as e:  # RSS is a bonus, the CSV export is the base
        print("  Letterboxd RSS nicht erreichbar:", e)
        return []
    ns = {"letterboxd": "https://letterboxd.com", "tmdb": "https://themoviedb.org"}
    items = []
    for it in root.iter("item"):
        title = it.findtext("letterboxd:filmTitle", namespaces=ns)
        if not title:
            continue  # lists etc.
        rating = it.findtext("letterboxd:memberRating", namespaces=ns)
        items.append({
            "title": title,
            "year": it.findtext("letterboxd:filmYear", namespaces=ns),
            "tmdb": int(it.findtext("tmdb:movieId", namespaces=ns) or 0) or None,
            "watched": it.findtext("letterboxd:watchedDate", namespaces=ns),
            "rating": float(rating) if rating else None,
            "rewatch": it.findtext("letterboxd:rewatch", namespaces=ns) == "Yes",
            "liked": it.findtext("letterboxd:memberLike", namespaces=ns) == "Yes",
            "guid": it.findtext("guid"),
        })
    return items


def find_movie(title, year):
    key = re.sub(r"[^a-z0-9]+", "-", f"{title}-{year}".lower()).strip("-")
    res = tmdb("/search/movie", f"search_movie_{key}", query=title,
               primary_release_year=year or "", language="en-US")
    hits = (res or {}).get("results") or []
    if not hits and year:  # release years sometimes differ by one
        res = tmdb("/search/movie", f"search_movie_{key}_any", query=title, language="en-US")
        hits = (res or {}).get("results") or []
        hits = [h for h in hits if (h.get("release_date") or "")[:4] in {str(int(year) - 1), year, str(int(year) + 1)}] or hits
    return hits[0]["id"] if hits else None


def build_films():
    watched = read_csv("watched")
    ratings = {r["Letterboxd URI"]: r for r in read_csv("ratings")}
    diary = read_csv("diary")
    reviews = read_csv("reviews")
    watchlist = read_csv("watchlist")
    liked = {(r["Name"], r["Year"]) for r in read_csv("likes-films")}
    rss = letterboxd_rss()
    rss_ids = {(r["title"], r["year"]): r["tmdb"] for r in rss if r["tmdb"]}

    # Ratings are keyed by film URI; diary/reviews use per-entry URIs, so match on name+year
    rating_by_film = {(r["Name"], r["Year"]): float(r["Rating"]) for r in ratings.values() if r["Rating"]}
    # A set per film: the RSS feed repeats diary entries that are already in the export
    seen_dates = defaultdict(set)
    for d in diary:
        seen_dates[(d["Name"], d["Year"])].add(d["Watched Date"] or d["Date"])
    for r in reversed(rss):  # oldest → newest, so the latest rating wins over the export
        seen_dates[(r["title"], r["year"])].add(r["watched"])
        if r["rating"]:
            rating_by_film[(r["title"], r["year"])] = r["rating"]
        if r["liked"]:
            liked.add((r["title"], r["year"]))

    films = {}
    for w in watched + [{"Name": r["title"], "Year": r["year"], "Date": r["watched"]} for r in rss]:
        k = (w["Name"], w["Year"])
        films.setdefault(k, {"title": w["Name"], "year": w["Year"], "added": w["Date"]})

    keys = list(films)
    print(f"  {len(keys)} Filme, suche TMDB-IDs …")
    ids = pmap(lambda k: rss_ids.get(k) or find_movie(*k), keys)
    details = pmap(lambda i: tmdb(f"/movie/{i}", f"movie_{i}") if i else None, ids)

    out, review_texts, diary_out = [], {}, []
    for k, tid, det in zip(keys, ids, details):
        f = films[k]
        dates = sorted(d for d in seen_dates.get(k, []) if d)
        out.append({
            "tmdb": tid,
            "title": f["title"],
            "year": int(f["year"]) if f["year"] else None,
            "poster": (det or {}).get("poster_path"),
            "genres": [g["name"] for g in (det or {}).get("genres", [])],
            "runtime": (det or {}).get("runtime") or 0,
            "rating": rating_by_film.get(k),
            "liked": k in liked,
            "watched": dates[-1] if dates else f["added"],
            "logged": bool(dates),   # has diary entries (else only marked as watched)
            "views": max(len(dates), 1),
        })
    tmdb_by_key = dict(zip(keys, ids))

    for d in diary:
        k = (d["Name"], d["Year"])
        diary_out.append({"type": "film", "tmdb": tmdb_by_key.get(k), "title": d["Name"],
                          "date": d["Watched Date"] or d["Date"],
                          "rating": float(d["Rating"]) if d["Rating"] else None,
                          "rewatch": d["Rewatch"] == "Yes"})
    known = {(e["title"], e["date"]) for e in diary_out}
    for r in rss:
        if (r["title"], r["watched"]) not in known:
            diary_out.append({"type": "film", "tmdb": r["tmdb"], "title": r["title"], "date": r["watched"],
                              "rating": r["rating"], "rewatch": r["rewatch"]})
    for r in reviews:
        k = (r["Name"], r["Year"])
        if r["Review"].strip() and tmdb_by_key.get(k):
            review_texts.setdefault(f"film-{tmdb_by_key[k]}", []).append(
                {"date": r["Watched Date"] or r["Date"], "rating": float(r["Rating"]) if r["Rating"] else None,
                 "text": r["Review"]})

    wl_keys = [(w["Name"], w["Year"]) for w in watchlist]
    wl_ids = pmap(lambda k: find_movie(*k), wl_keys)
    wl_det = pmap(lambda i: tmdb(f"/movie/{i}", f"movie_{i}") if i else None, wl_ids)
    wl = [{"tmdb": i, "title": (d or {}).get("title") or k[0], "year": int(k[1]) if k[1] else None,
           "poster": (d or {}).get("poster_path"), "release": (d or {}).get("release_date")}
          for k, i, d in zip(wl_keys, wl_ids, wl_det) if i]

    missing = [f["title"] for f in out if not f["tmdb"]]
    if missing:
        print("  Ohne TMDB-Treffer:", ", ".join(missing))
    return out, diary_out, wl, review_texts


# ── SERIALIZD ────────────────────────────────────
def build_shows():
    s = json.loads((DATA / "serializd.json").read_text(encoding="utf-8"))
    status_of = {}
    for status in ["watchlist", "dropped", "paused", "watched", "watching"]:  # later wins
        for x in s["lists"].get(status, []):
            status_of[x["show"]] = status
    by_show = defaultdict(list)
    for e in s["diary"]:
        by_show[e["show"]].append(e)
        status_of.setdefault(e["show"], "watched")

    ids = list(status_of)
    print(f"  {len(ids)} Serien, lade TMDB-Daten …")
    # Show details change (new seasons, next episode) → refresh weekly
    details = pmap(lambda i: tmdb(f"/tv/{i}", f"tv_{i}", max_age_days=7), ids)

    shows, review_texts = [], {}
    for sid, det in zip(ids, details):
        det = det or {}
        entries = by_show.get(sid, [])   # newest first
        episodes = [e for e in entries if e["e"] is not None and e["rating"]]
        ep_scores = [score10(e.get("review")) for e in episodes]
        ep_scores = [x for x in ep_scores if x is not None]
        show_entry = next((e for e in entries if e["s"] is None and e["e"] is None and e["rating"]), None)
        seasons = {}
        for e in entries:
            if e["s"] is not None and e["e"] is None and e["rating"]:
                seasons.setdefault(str(e["s"]), {"stars": stars(e["rating"]), "score": score10(e.get("review"))})
        avg_stars = sum(stars(e["rating"]) for e in episodes) / len(episodes) if episodes else None
        # Poster badge: a real Serializd rating (show, else latest season), else the episode average in half stars
        newest_season = next((e for e in entries if e["s"] is not None and e["e"] is None and e["rating"]), None)
        badge = (stars(show_entry["rating"]) if show_entry else stars(newest_season["rating"]) if newest_season
                 else round(avg_stars * 2) / 2 if avg_stars else None)
        nxt = det.get("next_episode_to_air")
        shows.append({
            "tmdb": sid,
            "name": det.get("name") or next((e["name"] for e in entries), None)
                    or next((x["name"] for l in s["lists"].values() for x in l if x["show"] == sid and x.get("name")), ""),
            "poster": det.get("poster_path"),
            "backdrop": det.get("backdrop_path"),
            "year": int((det.get("first_air_date") or "0")[:4]) or None,
            "genres": [g["name"] for g in det.get("genres", [])],
            "status": status_of[sid],
            "airing": det.get("status"),
            "seasons": det.get("number_of_seasons"),
            "episodes": det.get("number_of_episodes"),
            "runtime": (det.get("episode_run_time") or [None])[0] or (det.get("last_episode_to_air") or {}).get("runtime") or 40,
            "networks": [n["name"] for n in det.get("networks", [])][:2],
            "stars": stars(show_entry["rating"]) if show_entry else None,
            "score": score10(show_entry.get("review")) if show_entry else None,
            "seasonRatings": seasons,
            "badge": badge,
            "avgStars": round(avg_stars, 2) if avg_stars else None,
            "avgScore": round(sum(ep_scores) / len(ep_scores), 1) if ep_scores else None,
            "scoreCount": len(ep_scores),
            "episodesRated": len(episodes),
            "lastWatched": max((e["date"] for e in entries), default=None),
            "next": {"date": nxt["air_date"], "s": nxt["season_number"], "e": nxt["episode_number"],
                     "name": nxt["name"]} if nxt else None,
        })
        for e in entries:
            if e.get("review"):
                review_texts[f"sz-{e['id']}"] = e["review"]

    diary = [{"type": "episode" if e["e"] is not None else ("season" if e["s"] is not None else "show"),
              "tmdb": e["show"], "id": e["id"], "title": e["name"], "s": e["s"], "e": e["e"], "ep": e["ep"],
              "date": e["date"], "rating": stars(e["rating"]), "score": score10(e.get("review")),
              "rewatch": e["rewatch"], "review": bool(e.get("review"))}
             for e in s["diary"]]
    return shows, diary, review_texts


def stars(serializd_rating):
    """Serializd stores half stars as 1–10; the site shows them as 0.5–5 like Letterboxd."""
    return serializd_rating / 2 if serializd_rating else None


SCORE10 = re.compile(r"(\d{1,2}(?:[.,]\d{1,2})?)\s*/\s*10\b")


def score10(review):
    """The exact score I write into my Serializd reviews, e.g. '4/5 8.8/10' → 8.8.
    NFKC turns styled digits like '𝟖.𝟏/𝟏𝟎' into plain ones first."""
    text = unicodedata.normalize("NFKC", review or "")
    found = [float(x.replace(",", ".")) for x in SCORE10.findall(text)]
    found = [x for x in found if 0 <= x <= 10]
    return found[-1] if found else None


# ── RECOMMENDATIONS ──────────────────────────────
def my_provider_ids():
    ids = {}
    for kind in ["movie", "tv"]:
        res = tmdb(f"/watch/providers/{kind}", f"providers_{kind}_{REGION}", max_age_days=30,
                   watch_region=REGION, language="en-US")
        for p in (res or {}).get("results", []):
            name = p["provider_name"].lower()
            service = next((label for key, label in MY_SERVICES.items()
                            if name == key or name.startswith(key + " ")), None)
            if service and not any(x in name for x in ("amazon", "apple", "channel", "presents")):
                # variants like "Netflix Kids" count as Netflix; only the main entry keeps its logo
                ids[p["provider_id"]] = {"name": service, "logo": p["logo_path"] if name in MY_SERVICES else None}
    print("  Deine Dienste bei TMDB:", ", ".join(sorted({v["name"] for v in ids.values()})))
    return ids


def recommend(kind, seeds, seen, providers, limit=24):
    """Score TMDB recommendations of the highest-rated titles, keep those on my services."""
    scores, info, because = Counter(), {}, {}
    for tid, weight, title in seeds:
        res = tmdb(f"/{kind}/{tid}/recommendations", f"rec_{kind}_{tid}", max_age_days=14) or {}
        for rank, r in enumerate(res.get("results", [])[:20]):
            if r["id"] in seen or r.get("vote_count", 0) < 150:
                continue
            gain = weight * (1 - rank / 25)
            scores[r["id"]] += gain
            info[r["id"]] = r
            if gain > because.get(r["id"], (0, ""))[0]:
                because[r["id"]] = (gain, title)
    candidates = [i for i, _ in scores.most_common(120)]
    avail = pmap(lambda i: tmdb(f"/{kind}/{i}/watch/providers", f"wp_{kind}_{i}", max_age_days=7), candidates)
    out = []
    for i, wp in zip(candidates, avail):
        region = ((wp or {}).get("results") or {}).get(REGION, {})
        on = [providers[p["provider_id"]]["name"] for p in region.get("flatrate", []) if p["provider_id"] in providers]
        if not on:
            continue
        r = info[i]
        out.append({"tmdb": i, "title": r.get("title") or r.get("name"), "poster": r.get("poster_path"),
                    "year": int((r.get("release_date") or r.get("first_air_date") or "0")[:4]) or None,
                    "vote": round(r.get("vote_average", 0), 1), "on": sorted(set(on)),
                    "because": because[i][1]})
        if len(out) >= limit:
            break
    return out


# ── MAIN ─────────────────────────────────────────
def main():
    CACHE.mkdir(exist_ok=True)
    print("Filme (Letterboxd) …")
    films, film_diary, film_watchlist, film_reviews = build_films()
    print("Serien (Serializd) …")
    shows, show_diary, show_reviews = build_shows()

    print("Vorschläge …")
    providers = my_provider_ids()
    film_seeds = [(f["tmdb"], f["rating"], f["title"]) for f in sorted(films, key=lambda f: -(f["rating"] or 0))
                  if f["tmdb"] and (f["rating"] or 0) >= 4][:30]
    taste = lambda s: s["stars"] or s["avgStars"] or 0   # 0.5–5
    show_seeds = [(s["tmdb"], taste(s), s["name"]) for s in sorted(shows, key=lambda s: -taste(s))
                  if taste(s) >= 4][:30]
    seen_films = {f["tmdb"] for f in films} | {f["tmdb"] for f in film_watchlist}
    seen_shows = {s["tmdb"] for s in shows}
    rec_films = recommend("movie", film_seeds, seen_films, providers)
    rec_shows = recommend("tv", show_seeds, seen_shows, providers)

    year = str(date.today().year)
    sz = json.loads((DATA / "serializd.json").read_text(encoding="utf-8"))
    profile = sz.get("profile", {})   # numbers as shown on the Serializd profile page
    diary = sorted(film_diary + show_diary, key=lambda e: e["date"] or "", reverse=True)

    dashboard = {
        "generated": date.today().isoformat(),
        "stats": {
            "films": len(films),
            # Same as Letterboxd's "this year": distinct films with a diary entry this year
            "filmsThisYear": len({e["tmdb"] or e["title"] for e in film_diary if (e["date"] or "").startswith(year)}),
            "filmHours": round(sum(f["runtime"] * f["views"] for f in films) / 60),
            "showsWatched": len(sz["lists"].get("watched", [])),
            "showsWatching": len(sz["lists"].get("watching", [])),
            "episodesWatched": profile.get("episodesWatched"),
            "tvTime": profile.get("tvTime"),
            "episodesLogged": sum(1 for e in show_diary if e["type"] == "episode"),
            "filmAvg": round(sum(f["rating"] for f in films if f["rating"]) / max(1, sum(1 for f in films if f["rating"])), 2),
            "episodeAvg": round(sum(e["rating"] for e in show_diary if e["type"] == "episode" and e["rating"])
                                / max(1, sum(1 for e in show_diary if e["type"] == "episode" and e["rating"])), 2),
            # average of the exact x/10 scores written in my reviews
            "episodeScoreAvg": round(sum(e["score"] for e in show_diary if e["type"] == "episode" and e["score"] is not None)
                                     / max(1, sum(1 for e in show_diary if e["type"] == "episode" and e["score"] is not None)), 1),
        },
        "providers": sorted({v["name"]: v["logo"] for v in providers.values() if v["logo"]}.items()),
        "films": sorted(films, key=lambda f: f["watched"] or "", reverse=True),
        "shows": sorted(shows, key=lambda s: s["lastWatched"] or "", reverse=True),
        "diary": diary,
        "watchlist": {"films": film_watchlist,
                      "shows": [s["tmdb"] for s in shows if s["status"] == "watchlist"]},
        "recommendations": {"films": rec_films, "shows": rec_shows},
    }
    (DATA / "dashboard.json").write_text(json.dumps(dashboard, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (DATA / "reviews.json").write_text(json.dumps({**film_reviews, **show_reviews}, ensure_ascii=False,
                                                  separators=(",", ":")), encoding="utf-8")
    st = dashboard["stats"]
    print(f"\nFertig: {st['films']} Filme, {st["showsWatched"]} Serien, {len(diary)} Tagebuch-Einträge, "
          f"{len(rec_films)} + {len(rec_shows)} Vorschläge")
    print(f"dashboard.json: {(DATA / 'dashboard.json').stat().st_size // 1024} KB")


if __name__ == "__main__":
    sys.exit(main())
