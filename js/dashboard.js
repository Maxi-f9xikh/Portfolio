/* ═══════════════════════════════════════════════
   Watch Dashboard — Maximilian Stickel
   Data: data/dashboard.json (built by tools/build_dashboard.py)
   Live: upcoming episodes + movie releases from TMDB
═══════════════════════════════════════════════ */

const IMG = 'https://image.tmdb.org/t/p/';
const PAGE_SIZE = 60;
const dash = {
    data: null,
    reviews: null,
    filmById: new Map(),
    showById: new Map(),
    lib: { kind: 'films', status: 'all', sort: 'recent', query: '', shown: PAGE_SIZE },
    recKind: 'shows',
    live: new Map(),   // tmdb details fetched in the browser
};

// ── HELPERS ───────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtNum = n => Number(n).toLocaleString('de-DE');
const dayFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const shortFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'short' });
const parseDay = iso => new Date(iso + 'T12:00:00');

function relDay(iso) {
    if (!iso) return '';
    const diff = Math.round((parseDay(iso) - parseDay(todayISO())) / 86400000);
    if (diff === 0) return 'Heute';
    if (diff === -1) return 'Gestern';
    if (diff === 1) return 'Morgen';
    return diff > 0 && diff < 7 ? dayFmt.format(parseDay(iso)) : shortFmt.format(parseDay(iso));
}

// Letterboxd 0.5–5 / Serializd 1–10 → star string
function stars(outOf5) {
    if (outOf5 == null) return '';
    const full = Math.floor(outOf5 + 0.001);
    return '★'.repeat(full) + (outOf5 - full >= 0.5 ? '½' : '');
}
const starsHTML = outOf5 => outOf5 == null ? '' : `<span class="stars" aria-label="${outOf5} von 5 Sternen">${stars(outOf5)}</span>`;
const fmt10 = r => (Math.round(r * 10) / 10).toLocaleString('de-DE');

function posterHTML(path, title, size = 'w185', badge = '', flag = '') {
    const img = path
        ? `<img src="${IMG}${size}${path}" alt="" loading="lazy" decoding="async">`
        : `<span class="poster-fallback">${esc(title)}</span>`;
    return `<div class="poster">${img}${badge ? `<span class="poster-badge">${badge}</span>` : ''}${flag ? `<span class="poster-flag">${flag}</span>` : ''}</div>`;
}
const thumb = path => path ? `<img src="${IMG}w92${path}" alt="" loading="lazy">` : '<span class="cal-thumb"></span>';

// Poster badge: Serializd show/season rating, else episode average in half stars (0.5–5)
const showScore = s => s.badge;
// "★★★★ 4/5 · 8,8/10" — stars plus the exact score from my review when there is one
const ratingHTML = (stars5, score10) => stars5 == null ? '' :
    `${starsHTML(stars5)}<span class="score">${fmt10(stars5)}/5${score10 != null ? ` · ${fmt10(score10)}/10` : ''}</span>`;

async function tmdbGet(path, params = {}) {
    if (typeof TMDB_API_KEY === 'undefined' || !TMDB_API_KEY || TMDB_API_KEY.startsWith('HIER')) return null;
    const q = new URLSearchParams({ api_key: TMDB_API_KEY, language: 'en-US', ...params });
    try {
        const r = await fetch(`https://api.themoviedb.org/3${path}?${q}`);
        return r.ok ? r.json() : null;
    } catch { return null; }
}

async function pool(items, limit, fn) {
    const out = new Array(items.length);
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
    }));
    return out;
}

// ── STATS ─────────────────────────────────────
const tilesHTML = tiles => tiles.map(([v, l]) =>
    `<div class="stat-item"><div class="stat-number">${v}</div><div class="stat-label">${l}</div></div>`).join('');

function renderStats() {
    const s = dash.data.stats;
    const year = new Date().getFullYear();
    const tv = s.tvTime;   // as shown on Serializd: months / days / hours
    const tiles = [
        [fmtNum(s.films), 'Filme gesehen'],
        [fmtNum(s.filmsThisYear), `Filme ${year}`],
        [fmtNum(s.showsWatched), 'Serien gesehen'],
        [s.episodesWatched ? fmtNum(s.episodesWatched) : fmtNum(s.episodesLogged), 'Folgen gesehen'],
    ];
    if (tv) tiles.push([`${tv.months}<small>M</small> ${tv.days}<small>T</small>`, 'Zeit mit Serien']);
    tiles.push([`${fmtNum(s.filmHours)}<small>h</small>`, 'Zeit mit Filmen']);
    $('dash-stats').innerHTML = tilesHTML(tiles);
    $('dash-averages').innerHTML = tilesHTML([
        [`${fmt10(s.filmAvg)}<small>/5</small>`, 'Ø Filmbewertung'],
        [`${fmt10(s.episodeAvg)}<small>/5</small>`, 'Ø Folge (Sterne)'],
        [`${fmt10(s.episodeScoreAvg)}<small>/10</small>`, 'Ø Folge (meine Note)'],
        [fmtNum(dash.data.films.filter(f => f.rating != null).length), 'Filme bewertet'],
        [fmtNum(s.episodesLogged), 'Folgen im Tagebuch'],
        [fmtNum(dash.data.films.filter(f => f.liked).length), 'Lieblingsfilme ♥'],
    ]);
    // Letterboxd is checked automatically every few hours, so show the newest entry, not a check time
    const newestFilm = dash.data.diary.find(e => e.type === 'film');
    $('dash-updated').textContent = `Serien: Stand ${parseDay(dash.data.generated).toLocaleDateString('de-DE')}`
        + (newestFilm ? ` · Filme: automatisch von Letterboxd, neuester Eintrag ${parseDay(newestFilm.date).toLocaleDateString('de-DE')}` : '');
}

// ── CURRENTLY WATCHING ────────────────────────
function lastEpisode(showId) {
    return dash.data.diary.find(e => e.tmdb === showId && e.type === 'episode');
}

// "S1E6–14" when several episodes of the same season were watched on the latest day
function lastEpisodesLabel(last) {
    const sameDay = dash.data.diary.filter(e => e.tmdb === last.tmdb && e.type === 'episode' && e.date === last.date && e.s === last.s);
    const nums = sameDay.map(e => e.e);
    const lo = Math.min(...nums), hi = Math.max(...nums);
    return lo === hi ? `S${last.s}E${hi}` : `S${last.s}E${lo}–${hi}`;
}

function renderWatching() {
    const shows = dash.data.shows.filter(s => s.status === 'watching')
        .sort((a, b) => (b.lastWatched || '').localeCompare(a.lastWatched || ''));
    $('dash-watching').innerHTML = shows.map(s => {
        const last = lastEpisode(s.tmdb);
        const score = showScore(s);
        const badge = score ? `<span class="star">★</span> ${fmt10(score)}` : '';
        const sub = last ? `<span class="accent">${lastEpisodesLabel(last)}</span> · ${relDay(last.date)}` : 'Noch nicht bewertet';
        return `<button class="tile" data-kind="show" data-id="${s.tmdb}">
            ${posterHTML(s.poster, s.name, 'w185', badge)}
            <div class="tile-title">${esc(s.name)}</div>
            <div class="tile-meta">${sub}</div>
        </button>`;
    }).join('') || '<p class="dash-empty">Gerade keine Serie.</p>';
}

// ── UPCOMING ──────────────────────────────────
const CAL_LIMIT = 6;

function calendarHTML(items, empty) {
    if (!items.length) return `<p class="dash-empty">${empty}</p>`;
    let html = '', lastDay = null;
    items.forEach((it, idx) => {
        if (idx === CAL_LIMIT) html += '<div class="cal-more" hidden>';
        if (it.date !== lastDay) {
            const rel = relDay(it.date);
            const label = ['Heute', 'Morgen'].includes(rel) ? `${rel} · ${shortFmt.format(parseDay(it.date))}` : dayFmt.format(parseDay(it.date));
            html += `<div class="cal-day${it.date === todayISO() ? ' today' : ''}">${label}</div>`;
            lastDay = it.date;
        }
        html += `<button class="cal-item" data-kind="${it.kind}" data-id="${it.id}">
            ${thumb(it.poster)}
            <span class="cal-text">
                <span class="cal-title">${esc(it.title)}${it.tag ? `<span class="cal-tag">${it.tag}</span>` : ''}</span>
                <span class="cal-sub" style="display:block">${esc(it.sub)}</span>
            </span>
        </button>`;
    });
    if (items.length > CAL_LIMIT) {
        html += `</div><button class="filter-btn cal-toggle" type="button">Alle ${items.length} anzeigen</button>`;
    }
    return html;
}

function initCalendarToggles() {
    document.querySelector('.dash-upcoming').addEventListener('click', e => {
        const btn = e.target.closest('.cal-toggle');
        if (!btn) return;
        const more = btn.previousElementSibling;
        more.hidden = !more.hidden;
        btn.textContent = more.hidden ? `Alle ${btn.parentElement.querySelectorAll('.cal-item').length} anzeigen` : 'Weniger anzeigen';
    });
}

async function renderEpisodes() {
    const today = todayISO();
    const horizon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const followed = dash.data.shows.filter(s =>
        ['watching', 'watched', 'paused'].includes(s.status) &&
        ['Returning Series', 'In Production', 'Planned'].includes(s.airing));

    // Live data first, the build snapshot as fallback (no key / offline)
    const live = await pool(followed, 6, s => tmdbGet(`/tv/${s.tmdb}`));
    const items = [];
    followed.forEach((s, i) => {
        if (live[i]) dash.live.set('show-' + s.tmdb, live[i]);
        const n = live[i] ? live[i].next_episode_to_air : (s.next && { air_date: s.next.date, season_number: s.next.s, episode_number: s.next.e, name: s.next.name });
        if (!n || !n.air_date || n.air_date < today || n.air_date > horizon) return;
        const tag = n.episode_number === 1 ? (n.season_number === 1 ? 'Neue Serie' : 'Neue Staffel')
            : (n.episode_type === 'finale' ? 'Finale' : '');
        items.push({
            kind: 'show', id: s.tmdb, date: n.air_date, poster: s.poster, title: s.name, tag,
            sub: `S${n.season_number}E${n.episode_number}${n.name && !/^Episode \d+$/.test(n.name) ? ' · ' + n.name : ''}`,
        });
    });
    items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    $('dash-episodes').innerHTML = calendarHTML(items, 'In den nächsten 60 Tagen kommen keine neuen Folgen.');
}

async function renderMovies() {
    const today = todayISO();
    const seen = new Set(dash.data.films.map(f => f.tmdb));
    const watchlist = new Map(dash.data.watchlist.films.map(f => [f.tmdb, f]));
    const items = new Map();

    for (const f of dash.data.watchlist.films) {
        if (f.release && f.release >= today) {
            items.set(f.tmdb, { kind: 'film', id: f.tmdb, date: f.release, poster: f.poster, title: f.title, tag: 'Watchlist', sub: 'Auf meiner Watchlist' });
        }
    }
    const pages = await Promise.all([1, 2].map(page => tmdbGet('/movie/upcoming', { region: 'DE', page })));
    const upcoming = pages.flatMap(p => p ? p.results : [])
        .filter(m => m.release_date >= today && !seen.has(m.id) && m.popularity > 15)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 12);
    for (const m of upcoming) {
        if (items.has(m.id)) continue;
        items.set(m.id, {
            kind: 'upcoming', id: m.id, date: m.release_date, poster: m.poster_path, title: m.title,
            tag: watchlist.has(m.id) ? 'Watchlist' : '', sub: 'Kinostart in Deutschland',
        });
        dash.live.set('upcoming-' + m.id, m);
    }
    const list = [...items.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
    $('dash-movies').innerHTML = calendarHTML(list, upcoming.length || !pages[0]
        ? 'Gerade keine neuen Filme.' : 'Neue Filme konnten nicht geladen werden.');
}

// ── RECOMMENDATIONS ───────────────────────────
function providerHTML(names) {
    const logos = new Map(dash.data.providers);
    return names.map(n => `<span class="provider">${logos.get(n) ? `<img src="${IMG}w45${logos.get(n)}" alt="">` : ''}${esc(n)}</span>`).join('');
}

function renderRecs() {
    const recs = dash.data.recommendations[dash.recKind];
    const kind = dash.recKind === 'films' ? 'rec-film' : 'rec-show';
    $('dash-recs').innerHTML = recs.map(r => `<button class="tile" data-kind="${kind}" data-id="${r.tmdb}">
            ${posterHTML(r.poster, r.title, 'w185', `TMDB ${fmt10(r.vote)}`)}
            <div class="tile-title">${esc(r.title)}</div>
            <div class="tile-meta">Weil ich <span class="accent">${esc(r.because)}</span> mochte</div>
            <div class="tile-on">${providerHTML(r.on)}</div>
        </button>`).join('') || '<p class="dash-empty">Keine Vorschläge.</p>';
    $('dash-rec-sub').textContent = `Läuft auf ${dash.data.providers.map(p => p[0]).join(', ')} · Verfügbarkeit: JustWatch`;
}

// ── DIARY ─────────────────────────────────────
function renderDiary() {
    const entries = dash.data.diary.slice(0, 12);
    $('dash-diary').innerHTML = entries.map(e => {
        const isFilm = e.type === 'film';
        const item = isFilm ? dash.filmById.get(e.tmdb) : dash.showById.get(e.tmdb);
        const poster = item ? item.poster : null;
        let sub;
        if (isFilm) sub = `Film${item && item.year ? ' · ' + item.year : ''}`;
        else if (e.type === 'episode') sub = `S${e.s}E${e.e}${e.ep ? ' · ' + e.ep : ''}`;
        else if (e.type === 'season') sub = `Staffel ${e.s} komplett`;
        else sub = 'Ganze Serie';
        const rating = ratingHTML(e.rating, isFilm ? null : e.score);
        const pills = (e.rewatch ? '<span class="pill">Rewatch</span>' : '') + (e.review ? '<span class="pill">Review</span>' : '');
        return `<li class="diary-item" tabindex="0" data-kind="${isFilm ? 'film' : 'show'}" data-id="${e.tmdb}">
            ${thumb(poster)}
            <div class="diary-main">
                <div class="diary-title">${esc(item ? (item.title || item.name) : e.title)}${pills}</div>
                <div class="diary-sub">${esc(sub)}</div>
            </div>
            <div class="diary-side">
                <div>${rating}</div>
                <div class="diary-date">${relDay(e.date)}</div>
            </div>
        </li>`;
    }).join('');
}

// ── CHARTS ────────────────────────────────────
// Column with rounded data-end (top), square at the baseline
function colPath(x, y, w, h, r = 4) {
    if (h <= 0) return '';
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function niceMax(v) {
    if (v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 4, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
}

function attachTips(container, tipsData) {
    const fig = container.closest('figure');
    let tip = fig.querySelector('.chart-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; fig.appendChild(tip); }
    container.querySelectorAll('[data-tip]').forEach(el => {
        const show = () => {
            const r = el.getBoundingClientRect(), f = fig.getBoundingClientRect();
            tip.innerHTML = tipsData[el.dataset.tip];
            tip.style.left = (r.left + r.width / 2 - f.left) + 'px';
            tip.style.top = (r.top - f.top + Number(el.dataset.top || 0) * r.height) + 'px';
            tip.classList.add('show');
        };
        el.addEventListener('mouseenter', show);
        el.addEventListener('focus', show);
        el.addEventListener('mouseleave', () => tip.classList.remove('show'));
        el.addEventListener('blur', () => tip.classList.remove('show'));
    });
}

/* series: [{label, color, values[]}] stacked bottom→top */
function columnChart(el, labels, series, { height = 200, tipTitle = l => l } = {}) {
    // Drawn at the real pixel width so text stays 11px at any size
    const W = Math.max(el.clientWidth, 260), H = height, padL = 30, padB = 22, padT = 18;
    const plotW = W - padL, plotH = H - padB - padT;
    const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
    const max = niceMax(Math.max(...totals, 1));
    const band = plotW / labels.length;
    const bw = Math.min(24, band * 0.62);
    const y = v => padT + plotH - (v / max) * plotH;
    const peak = totals.indexOf(Math.max(...totals));
    let svg = '';
    for (let t = 0; t <= 4; t++) {
        const v = (max / 4) * t, yy = y(v);
        svg += `<line class="chart-grid" x1="${padL}" x2="${W}" y1="${yy}" y2="${yy}"/>`;
        svg += `<text class="chart-axis" x="${padL - 6}" y="${yy + 4}" text-anchor="end">${v >= 1000 ? (v / 1000) + 'K' : Math.round(v)}</text>`;
    }
    const tips = [];
    labels.forEach((l, i) => {
        const x = padL + band * i + (band - bw) / 2;
        let base = 0;
        const segs = series.map(s => ({ s, v: s.values[i] })).filter(o => o.v > 0);
        segs.forEach((o, k) => {
            const top = k === segs.length - 1;
            const y0 = y(base + o.v), h = y(base) - y0 - (k > 0 ? 2 : 0);   // 2px surface gap between segments
            svg += top
                ? `<path d="${colPath(x, y0, bw, h)}" style="fill:${o.s.color}"/>`
                : `<rect x="${x}" y="${y0}" width="${bw}" height="${Math.max(h, 0)}" style="fill:${o.s.color}"/>`;
            base += o.v;
        });
        if (i === peak && totals[i] > 0) {
            svg += `<text class="chart-value" x="${x + bw / 2}" y="${y(totals[i]) - 5}" text-anchor="middle">${totals[i]}</text>`;
        }
        svg += `<text class="chart-axis" x="${padL + band * i + band / 2}" y="${H - 5}" text-anchor="middle">${esc(l)}</text>`;
        svg += `<rect class="chart-hit" x="${padL + band * i}" y="${padT}" width="${band}" height="${plotH}" data-tip="${i}" tabindex="0"/>`;
        tips.push(`<b>${esc(tipTitle(l, i))}</b>` + series.map(s => `<br>${esc(s.label)}: ${s.values[i]}`).join(''));
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(series.map(s => s.label).join(' und '))} pro ${labels.length > 10 ? 'Monat' : 'Bewertung'}">${svg}</svg>`;
    attachTips(el, tips);
}

function renderCharts() {
    const d = dash.data;
    // Activity, last 12 months
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
    }
    const films = Object.fromEntries(months.map(m => [m, 0]));
    const eps = Object.fromEntries(months.map(m => [m, 0]));
    // Diary entries only, like Letterboxd/Serializd count them
    for (const e of d.diary) {
        const m = (e.date || '').slice(0, 7);
        if (e.type === 'film' && m in films) films[m]++;
        else if (e.type === 'episode' && m in eps) eps[m]++;
    }
    const labels = months.map(m => monthFmt.format(new Date(m + '-15')).replace('.', ''));
    const mLong = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
    columnChart($('chart-activity'), labels, [
        { label: 'Filme', color: 'var(--blue)', values: months.map(m => films[m]) },
        { label: 'Folgen', color: 'var(--series-2)', values: months.map(m => eps[m]) },
    ], { height: 220, tipTitle: (_, i) => mLong.format(new Date(months[i] + '-15')) });
    $('chart-activity').insertAdjacentHTML('beforeend', `<details class="dash-table"><summary>Als Tabelle anzeigen</summary>
        <table><thead><tr><th>Monat</th><th>Filme</th><th>Folgen</th></tr></thead><tbody>
        ${months.map((m, i) => `<tr><td>${mLong.format(new Date(m + '-15'))}</td><td>${films[m]}</td><td>${eps[m]}</td></tr>`).join('')}
        </tbody></table></details>`);

    // Rating distributions
    const filmBuckets = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    columnChart($('chart-films'), filmBuckets.map(b => fmt10(b)), [
        { label: 'Filme', color: 'var(--blue)', values: filmBuckets.map(b => d.films.filter(f => f.rating === b).length) },
    ], { height: 170, tipTitle: l => `${l} von 5 Sternen` });
    columnChart($('chart-episodes'), filmBuckets.map(b => fmt10(b)), [
        { label: 'Folgen', color: 'var(--blue)', values: filmBuckets.map(b => d.diary.filter(e => e.type === 'episode' && e.rating === b).length) },
    ], { height: 170, tipTitle: l => `${l} von 5 Sternen` });

    // Top genres across films and shows I've watched
    const genres = new Map();
    for (const f of d.films) f.genres.forEach(g => genres.set(g, (genres.get(g) || 0) + 1));
    for (const s of d.shows) if (s.status !== 'watchlist') s.genres.forEach(g => genres.set(g, (genres.get(g) || 0) + 1));
    $('dash-genres').innerHTML = [...genres].sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([g, n]) => `<span class="genre-chip"><b>${n}</b>${esc(g)}</span>`).join('');
}

// ── LIBRARY ───────────────────────────────────
function libraryItems() {
    const { kind, status, sort, query } = dash.lib;
    const d = dash.data;
    let items;
    if (kind === 'films') {
        items = d.films.map(f => ({ kind: 'film', id: f.tmdb, title: f.title, year: f.year, poster: f.poster, score: f.rating, date: f.watched, liked: f.liked }));
    } else if (kind === 'shows') {
        items = d.shows.filter(s => s.status !== 'watchlist' && (status === 'all' || s.status === status))
            .map(s => ({ kind: 'show', id: s.tmdb, title: s.name, year: s.year, poster: s.poster, score: showScore(s), date: s.lastWatched, status: s.status }));
    } else {
        items = [
            ...d.watchlist.films.map(f => ({ kind: 'film', id: f.tmdb, title: f.title, year: f.year, poster: f.poster, flag: 'Film' })),
            ...d.shows.filter(s => s.status === 'watchlist').map(s => ({ kind: 'show', id: s.tmdb, title: s.name, year: s.year, poster: s.poster, flag: 'Serie' })),
        ];
    }
    if (query) {
        const q = query.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(q));
    }
    const by = {
        recent: (a, b) => (b.date || '').localeCompare(a.date || ''),
        rating: (a, b) => (b.score ?? -1) - (a.score ?? -1) || a.title.localeCompare(b.title),
        title: (a, b) => a.title.localeCompare(b.title, 'de'),
        year: (a, b) => (b.year || 0) - (a.year || 0),
    }[sort];
    if (kind !== 'watchlist' || sort !== 'recent') items.sort(by);
    return items;
}

const STATUS_LABEL = { watching: 'Gerade dabei', watched: 'Gesehen', paused: 'Pausiert', dropped: 'Abgebrochen' };

function renderLibrary() {
    const items = libraryItems();
    const { kind, shown } = dash.lib;
    $('dash-status').hidden = kind !== 'shows';
    $('dash-lib-count').textContent = `${fmtNum(items.length)} ${kind === 'films' ? 'Filme' : kind === 'shows' ? 'Serien' : 'Titel'}`;
    $('dash-library').innerHTML = items.slice(0, shown).map(i => {
        const badge = i.score != null ? `<span class="star">★</span> ${fmt10(i.score)}` : '';
        const meta = [i.year, i.liked ? '♥' : '', i.status && i.status !== 'watched' ? STATUS_LABEL[i.status] : ''].filter(Boolean).join(' · ');
        return `<button class="tile" data-kind="${i.kind}" data-id="${i.id}">
            ${posterHTML(i.poster, i.title, 'w185', badge, i.flag || '')}
            <div class="tile-title">${esc(i.title)}</div>
            <div class="tile-meta">${esc(meta)}</div>
        </button>`;
    }).join('') || '<p class="dash-empty">Nichts gefunden.</p>';
    $('dash-more').hidden = items.length <= shown;
}

// ── VIEWS (tabs, linked via #hash) ────────────
const VIEW_LIB = { filme: ['films', 'Filme'], serien: ['shows', 'Serien'], watchlist: ['watchlist', 'Watchlist'] };
let chartsDrawn = false;

function showView(view) {
    if (!document.querySelector(`#dash-nav [data-view="${view}"]`)) view = 'uebersicht';
    document.querySelectorAll('#dash-nav [data-view]').forEach(a => {
        const on = a.dataset.view === view;
        a.classList.toggle('active', on);
        a.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.dash-view').forEach(v => { v.hidden = !v.dataset.view.split(' ').includes(view); });
    if (VIEW_LIB[view]) {
        const [kind, title] = VIEW_LIB[view];
        if (dash.lib.kind !== kind) Object.assign(dash.lib, { kind, shown: PAGE_SIZE, status: 'all' });
        $('dash-status').value = dash.lib.status;
        $('dash-lib-title').textContent = title;
        renderLibrary();
    }
    if (view === 'statistiken' && !chartsDrawn) { renderCharts(); chartsDrawn = true; }   // needs a visible width
}

function initViews() {
    const fromHash = () => showView(decodeURIComponent(location.hash.slice(1)) || 'uebersicht');
    window.addEventListener('hashchange', fromHash);
    fromHash();
}

function initLibraryControls() {
    let t;
    $('dash-search').addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => { Object.assign(dash.lib, { query: e.target.value.trim(), shown: PAGE_SIZE }); renderLibrary(); }, 150);
    });
    $('dash-status').addEventListener('change', e => { Object.assign(dash.lib, { status: e.target.value, shown: PAGE_SIZE }); renderLibrary(); });
    $('dash-sort').addEventListener('change', e => { dash.lib.sort = e.target.value; renderLibrary(); });
    $('dash-more').addEventListener('click', () => { dash.lib.shown += PAGE_SIZE; renderLibrary(); });

    $('dash-rec-tabs').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        $('dash-rec-tabs').querySelectorAll('.filter-btn').forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-selected', String(b === btn));
        });
        dash.recKind = btn.dataset.kind;
        renderRecs();
    });
}

// ── DETAIL MODAL ──────────────────────────────
async function loadReviews() {
    if (dash.reviews) return dash.reviews;
    dash.reviews = await loadData('reviews.json') || {};
    // Add reviews from the live Letterboxd feed that the build doesn't have yet
    for (const [key, list] of Object.entries(dash.extraReviews || {})) {
        const have = dash.reviews[key] ||= [];
        for (const r of list) if (!have.some(h => h.date === r.date)) have.push(r);
        have.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return dash.reviews;
}

function ratingBox(label, html) {
    return `<div class="rating-box"><small>${label}</small>${html}</div>`;
}

function reviewHTML(meta, text) {
    return `<div class="modal-review"><div class="review-meta">${meta}</div>${esc(text)}</div>`;
}

async function openModal(kind, id) {
    id = Number(id);
    const d = dash.data;
    let title, year, poster, backdrop, genres = [], ratings = '', sections = '', links = [], overviewPath, meta = [];

    if (kind === 'film') {
        const f = dash.filmById.get(id) || d.watchlist.films.find(w => w.tmdb === id);
        if (!f) return;
        ({ title, year, poster } = f);
        genres = f.genres || [];
        if (f.runtime) meta.push(`${f.runtime} Min.`);
        if (f.rating != null) ratings += ratingBox('Letterboxd', `${starsHTML(f.rating)}<span class="score">${fmt10(f.rating)}/5</span>`);
        if (f.liked) ratings += ratingBox('Like', '<span class="stars">♥</span>');
        if (f.views > 1) ratings += ratingBox('Gesehen', `${f.views}×`);
        if (f.watched && f.rating !== undefined) ratings += ratingBox('Zuletzt', relDay(f.watched));
        links.push([`https://letterboxd.com/tmdb/${id}/`, 'Letterboxd']);
        overviewPath = `/movie/${id}`;
    } else if (kind === 'show') {
        const s = dash.showById.get(id);
        if (!s) return;
        title = s.name; year = s.year; poster = s.poster; backdrop = s.backdrop; genres = s.genres;
        meta.push(STATUS_LABEL[s.status] || 'Watchlist');
        if (s.seasons) meta.push(`${s.seasons} Staffel${s.seasons > 1 ? 'n' : ''}`);
        if (s.networks.length) meta.push(s.networks.join(', '));
        if (s.stars != null) ratings += ratingBox('Serializd · Serie', ratingHTML(s.stars, s.score));
        if (s.avgScore != null) ratings += ratingBox(`Ø meine Note · ${s.scoreCount} Folge${s.scoreCount === 1 ? '' : 'n'}`, `<span class="score" style="margin:0">${fmt10(s.avgScore)}/10</span>`);
        else if (s.avgStars != null) ratings += ratingBox(`Ø ${s.episodesRated} Folge${s.episodesRated === 1 ? '' : 'n'}`, ratingHTML(Math.round(s.avgStars * 2) / 2));
        const seasons = Object.entries(s.seasonRatings);
        if (seasons.length) {
            sections += `<div class="modal-section"><h4>Staffeln</h4><div class="season-chips">${seasons.map(([n, r]) =>
                `<span>S${n} ${ratingHTML(r.stars, r.score)}</span>`).join('')}</div></div>`;
        }
        const live = dash.live.get('show-' + id);
        const next = live ? live.next_episode_to_air : (s.next && { air_date: s.next.date, season_number: s.next.s, episode_number: s.next.e });
        if (next && next.air_date >= todayISO()) {
            sections += `<div class="modal-section"><h4>Nächste Folge</h4>S${next.season_number}E${next.episode_number} · ${parseDay(next.air_date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>`;
        }
        links.push([`https://www.serializd.com/show/${encodeURIComponent(s.name.replace(/\s+/g, '-'))}-${id}`, 'Serializd']);
        overviewPath = `/tv/${id}`;
    } else {   // recommendation or upcoming movie
        const isShow = kind === 'rec-show';
        const r = kind === 'upcoming' ? dash.live.get('upcoming-' + id) : d.recommendations[isShow ? 'shows' : 'films'].find(x => x.tmdb === id);
        if (!r) return;
        title = r.title; poster = r.poster ?? r.poster_path;
        year = r.year ?? (r.release_date ? Number(r.release_date.slice(0, 4)) : null);
        if (r.vote) ratings += ratingBox('TMDB', `<span class="stars">★</span><span class="score">${fmt10(r.vote)}/10</span>`);
        if (r.on) ratings += ratingBox('Läuft auf', `<div class="tile-on" style="margin:0">${providerHTML(r.on)}</div>`);
        if (r.because) meta.push(`Weil ich ${r.because} mochte`);
        if (kind === 'upcoming') meta.push(`Kinostart ${parseDay(r.release_date).toLocaleDateString('de-DE')}`);
        if (!isShow) links.push([`https://letterboxd.com/tmdb/${id}/`, 'Letterboxd']);
        overviewPath = `/${isShow ? 'tv' : 'movie'}/${id}`;
    }
    links.push([`https://www.themoviedb.org${overviewPath}`, 'TMDB']);

    const render = (overview = '', liveBackdrop = null) => {
        const bd = backdrop || liveBackdrop;
        $('dash-modal-body').innerHTML = `
            ${bd ? `<div class="modal-backdrop" style="background-image:url('${IMG}w780${bd}')"></div>` : '<div style="height:80px"></div>'}
            <div class="modal-main">
                ${posterHTML(poster, title, 'w342')}
                <div class="modal-info">
                    <h3 id="dash-modal-title">${esc(title)}</h3>
                    <div class="tile-meta">${esc([year, ...meta, genres.slice(0, 3).join(', ')].filter(Boolean).join(' · '))}</div>
                    <div class="modal-ratings">${ratings}</div>
                </div>
            </div>
            ${overview ? `<div class="modal-section"><h4>Handlung</h4><p style="font-size:14px;color:var(--text-muted)">${esc(overview)}</p></div>` : ''}
            ${sections}
            <div class="modal-section" id="dash-modal-reviews"></div>
            <div class="modal-section"><div class="modal-links">${links.map(([u, l]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${l} ↗</a>`).join('')}</div></div>`;
    };
    render();
    const modal = $('dash-modal');
    if (!modal.open) modal.showModal();

    const [det, reviews] = await Promise.all([tmdbGet(overviewPath), loadReviews()]);
    if (!modal.open) return;
    render(det && det.overview, det && det.backdrop_path);

    let revs = [];
    if (kind === 'film') {
        revs = (reviews[`film-${id}`] || []).map(r => reviewHTML(`${relDay(r.date)}${r.rating != null ? ' · ' + starsHTML(r.rating) : ''}`, r.text));
    } else if (kind === 'show') {
        revs = d.diary.filter(e => e.tmdb === id && e.review && reviews[`sz-${e.id}`]).slice(0, 10).map(e => {
            const what = e.type === 'episode' ? `S${e.s}E${e.e}` : e.type === 'season' ? `Staffel ${e.s}` : 'Serie';
            return reviewHTML(`${what} · ${relDay(e.date)}${e.rating ? ' · ' + ratingHTML(e.rating, e.score) : ''}`, reviews[`sz-${e.id}`]);
        });
    }
    if (revs.length) $('dash-modal-reviews').innerHTML = `<h4>Meine Reviews</h4>${revs.join('')}`;
}

function initModal() {
    const modal = $('dash-modal');
    $('dash-modal-close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    document.querySelector('.dash').addEventListener('click', e => {
        const el = e.target.closest('[data-kind][data-id]');
        if (el) openModal(el.dataset.kind, el.dataset.id);
    });
    document.querySelector('.dash').addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const el = e.target.closest('li[data-kind][data-id]');
        if (el) openModal(el.dataset.kind, el.dataset.id);
    });
}

// ── DATA SOURCES ──────────────────────────────
// Newest data comes straight from GitHub (pushed after every update, Letterboxd feed every 30 min),
// the copy on the server is the fallback.
const GITHUB_DATA = 'https://raw.githubusercontent.com/Maxi-f9xikh/Portfolio/main/data/';

async function loadData(file) {
    for (const url of [GITHUB_DATA + file, 'data/' + file]) {
        try {
            const r = await fetch(url, { cache: 'no-cache' });
            if (r.ok) return await r.json();
        } catch { /* try the next source */ }
    }
    return null;
}

// ── LIVE LETTERBOXD (updated by GitHub Actions every 30 min) ──
const loadLetterboxdFeed = () => loadData('letterboxd-feed.json');

/* Merge feed entries newer than the build into films + diary; returns films that need TMDB details */
function mergeLetterboxdFeed(feed) {
    const d = dash.data;
    const added = [];
    dash.extraReviews = {};
    const inDiary = new Set(d.diary.filter(e => e.type === 'film').map(e => `${e.tmdb}|${e.date}`));
    for (const e of [...feed.entries].reverse()) {   // oldest → newest, latest rating wins
        if (!e.tmdb || !e.date) continue;
        let film = dash.filmById.get(e.tmdb);
        const isNewEntry = !inDiary.has(`${e.tmdb}|${e.date}`);
        if (!film) {
            film = { tmdb: e.tmdb, title: e.title, year: e.year, poster: null, genres: [], runtime: 0,
                     rating: e.rating, liked: e.liked, watched: e.date, logged: true, views: 1 };
            d.films.push(film);
            dash.filmById.set(e.tmdb, film);
            added.push(film);
        } else if (isNewEntry) {
            film.views += 1;
        }
        if (e.rating != null) film.rating = e.rating;
        film.liked = film.liked || e.liked;
        if (e.date > (film.watched || '')) film.watched = e.date;
        if (isNewEntry) {
            d.diary.push({ type: 'film', tmdb: e.tmdb, title: e.title, date: e.date, rating: e.rating, rewatch: e.rewatch, review: !!e.review });
            inDiary.add(`${e.tmdb}|${e.date}`);
        }
        if (e.review) (dash.extraReviews[`film-${e.tmdb}`] ||= []).push({ date: e.date, rating: e.rating, text: e.review });
    }
    d.diary.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    d.films.sort((a, b) => (b.watched || '').localeCompare(a.watched || ''));

    // Film numbers follow the merged data
    const year = String(new Date().getFullYear());
    const rated = d.films.filter(f => f.rating != null);
    Object.assign(d.stats, {
        films: d.films.length,
        filmsThisYear: new Set(d.diary.filter(e => e.type === 'film' && (e.date || '').startsWith(year)).map(e => e.tmdb)).size,
        filmAvg: rated.reduce((a, f) => a + f.rating, 0) / Math.max(1, rated.length),
    });
    return added;
}

async function completeNewFilms(films) {
    if (!films.length) return;
    await pool(films, 4, async f => {
        const det = await tmdbGet(`/movie/${f.tmdb}`);
        if (!det) return;
        Object.assign(f, { poster: det.poster_path, genres: (det.genres || []).map(g => g.name), runtime: det.runtime || 0 });
    });
    renderDiary();
    if (dash.lib.kind === 'films') renderLibrary();
}

// ── INIT ──────────────────────────────────────
async function initDashboard() {
    dash.data = await loadData('dashboard.json');
    if (!dash.data) {
        $('dash-stats').innerHTML = '<p class="dash-empty">Die Daten konnten nicht geladen werden.</p>';
        return;
    }
    dash.data.films.forEach(f => dash.filmById.set(f.tmdb, f));
    dash.data.shows.forEach(s => dash.showById.set(s.tmdb, s));
    const feed = await loadLetterboxdFeed();
    const newFilms = feed ? mergeLetterboxdFeed(feed) : [];

    renderStats();
    renderWatching();
    renderRecs();
    renderDiary();
    let chartWidth = 0, rt;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            const w = $('chart-activity').clientWidth;
            if (w && w !== chartWidth) { chartWidth = w; renderCharts(); }
        }, 200);
    });
    initLibraryControls();
    initViews();
    initModal();
    initCalendarToggles();
    completeNewFilms(newFilms);
    renderEpisodes();
    renderMovies();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
else initDashboard();
