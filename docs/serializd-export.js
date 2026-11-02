// Serializd export — run on https://www.serializd.com/user/Maxxi187/diary (console or Claude in Chrome)
// Clicks through your diary pages and show lists like a normal visitor would,
// collects what the page loads, and downloads serializd-export.json.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cap = [];   // {u, t} — awaited before push so responses never land after a reset
  const of = window.fetch;
  window.fetch = async (...a) => {
    const r = await of(...a);
    try {
      const u = typeof a[0] === 'string' ? a[0] : a[0].url;
      if (u.includes('onrender')) cap.push({ u, t: await r.clone().text() });
    } catch (e) {}
    return r;
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', () => { if (String(this.__u).includes('onrender')) cap.push({ u: this.__u, t: this.responseText }); });
    return os.apply(this, arguments);
  };
  const json = c => { try { return JSON.parse(c.t); } catch (e) { return null; } };
  const pageItem = n => [...document.querySelectorAll('[class*="Pagination_paginationItem"]')].find(e => e.innerText.trim() === String(n));

  // Click page 2..N, waiting until each click brought new entries
  const paginate = async (pages, count) => {
    for (let p = 2; p <= pages; p++) {
      const item = pageItem(p);
      if (!item) { console.warn('Seite fehlt', p); continue; }
      const before = count(); item.click();
      for (let i = 0; i < 40 && count() === before; i++) await sleep(250);
      await sleep(300);
      console.log('Seite', p, '/', pages);
    }
  };

  // 1) Diary
  console.log('Tagebuch wird gelesen …');
  const reviews = new Map();
  const diaryCount = () => { for (const c of cap) for (const x of (json(c) || {}).reviews || []) reviews.set(x.id, x); return reviews.size; };
  let before = diaryCount(); pageItem(2).click();
  for (let i = 0; i < 40 && diaryCount() === before; i++) await sleep(250);
  const diaryPages = cap.map(json).find(d => d && d.reviews)?.totalPages || 1;
  await paginate(diaryPages, diaryCount);
  before = diaryCount(); pageItem(1)?.click();
  for (let i = 0; i < 40 && diaryCount() === before; i++) await sleep(250);
  diaryCount();
  const diary = [...reviews.values()].map(x => {
    const season = (x.showSeasons || []).find(s => s.id === x.seasonId);
    return {
      id: x.id, show: x.showId, name: x.showName, banner: x.showBannerImage, premiere: x.showPremiereDate,
      s: season ? season.seasonNumber : null, e: x.episodeNumber ?? null, ep: x.episodeName ?? null,
      rating: x.rating, date: (x.backdate || x.dateAdded || '').slice(0, 10), rewatch: !!x.isRewatch,
      review: x.reviewText || null
    };
  });
  console.log('Tagebuch:', diary.length, 'Einträge');

  // 2) Show lists — responses are told apart by their URL (…/watched, …/watchlist, …)
  [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Shows').click();
  await sleep(4000);
  const lists = {};
  const labels = { watching: 'Currently watching', watched: 'Watched', watchlist: 'Watchlist', paused: 'Paused', dropped: 'Dropped' };
  for (const [key, label] of Object.entries(labels)) {
    const btn = [...document.querySelectorAll('button, [role="button"]')]
      .filter(e => e.textContent.trim().endsWith(label))
      .sort((x, y) => x.textContent.length - y.textContent.length)[0];
    if (!btn) { console.warn('Liste nicht gefunden:', label); continue; }
    const start = cap.length;
    btn.click();
    const mine = () => cap.slice(start).filter(c => new URL(c.u, location.href).pathname.toLowerCase().includes(key));
    const shows = new Map();
    let total = null, pages = 1;
    const count = () => {
      for (const c of mine()) {
        const d = json(c); if (!d || !d.items) continue;
        total = d.numberOfShows ?? total; pages = d.totalPages || pages;
        for (const x of d.items) shows.set(x.showId, x);
      }
      return shows.size;
    };
    for (let i = 0; i < 40 && count() === 0; i++) await sleep(250);
    await paginate(pages, count);
    count();
    lists[key] = [...shows.values()].map(x => ({
      show: x.showId, name: x.showName, banner: x.bannerImage, seasonsLogged: (x.seasonIds || []).length,
      numSeasons: x.numSeasons, numEpisodes: x.numEpisodes, premiere: x.premiereDate, added: (x.dateAdded || '').slice(0, 10)
    }));
    console.log(label + ':', lists[key].length, total != null ? `(Serializd: ${total})` : '');
  }

  // 3) Profile numbers (episodes watched, TV time)
  [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Profile')?.click();
  for (let i = 0; i < 20 && !document.body.innerText.includes('Episodes watched'); i++) await sleep(500);
  const txt = document.body.innerText;
  const tv = txt.match(/Time spent watching TV\s*(\d+)\s*m\s*(\d+)\s*d\s*(\d+)\s*h/);
  const eps = txt.match(/([\d.,]+)\s*Episodes watched/);
  const profile = {
    episodesWatched: eps ? Number(eps[1].replace(/\D/g, '')) : null,
    tvTime: tv ? { months: +tv[1], days: +tv[2], hours: +tv[3] } : null
  };

  // 4) Download
  const data = { fetched: new Date().toISOString(), profile, diary, lists };
  window.__serializdExport = data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = 'serializd-export.json';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Fertig! serializd-export.json wurde heruntergeladen.');
})();
