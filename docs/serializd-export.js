// Serializd export — paste into the browser console on https://www.serializd.com/user/Maxxi187/diary
// Clicks through your diary pages and show lists like a normal visitor would,
// collects what the page loads, and downloads serializd-export.json.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cap = [];
  const of = window.fetch;
  window.fetch = async (...a) => {
    const r = await of(...a);
    try {
      const u = typeof a[0] === 'string' ? a[0] : a[0].url;
      if (u.includes('onrender')) r.clone().text().then(t => cap.push(t));
    } catch (e) {}
    return r;
  };
  const oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', () => { if (String(this.__u).includes('onrender')) cap.push(this.responseText); });
    return os.apply(this, arguments);
  };
  const parsed = () => cap.map(t => { try { return JSON.parse(t); } catch (e) { return null; } }).filter(Boolean);
  const waitNew = async before => { for (let i = 0; i < 40 && cap.length === before; i++) await sleep(250); await sleep(500); };
  const pageItem = n => [...document.querySelectorAll('[class*="Pagination_paginationItem"]')].find(e => e.innerText.trim() === String(n));
  const paginate = async pages => {
    for (let p = 2; p <= pages; p++) {
      const item = pageItem(p);
      if (!item) { console.warn('Seite fehlt', p); continue; }
      const b = cap.length; item.click(); await waitNew(b);
      console.log('Seite', p, '/', pages);
    }
  };

  // 1) Diary
  console.log('Tagebuch wird gelesen …');
  let b = cap.length; pageItem(2).click(); await waitNew(b);
  const diaryPages = parsed().find(d => d.reviews)?.totalPages || 1;
  await paginate(diaryPages);
  b = cap.length; pageItem(1)?.click(); await waitNew(b);
  const reviews = new Map();
  for (const d of parsed()) for (const x of d.reviews || []) reviews.set(x.id, x);
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

  // 2) Show lists
  [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'Shows').click();
  await sleep(4000);
  const lists = {};
  const labels = { watching: 'Currently watching', watched: 'Watched', watchlist: 'Watchlist', paused: 'Paused', dropped: 'Dropped' };
  for (const [key, label] of Object.entries(labels)) {
    const btn = [...document.querySelectorAll('button, [role="button"]')]
      .filter(e => e.textContent.trim().endsWith(label))
      .sort((x, y) => x.textContent.length - y.textContent.length)[0];
    if (!btn) { console.warn('Liste nicht gefunden:', label); continue; }
    cap.length = 0;
    btn.click();
    for (let i = 0; i < 40 && !parsed().some(d => d.items); i++) await sleep(250);
    await paginate(parsed().find(d => d.items)?.totalPages || 1);
    const shows = new Map();
    for (const d of parsed()) for (const x of d.items || []) shows.set(x.showId, {
      show: x.showId, name: x.showName, banner: x.bannerImage, seasonsLogged: (x.seasonIds || []).length,
      numSeasons: x.numSeasons, numEpisodes: x.numEpisodes, premiere: x.premiereDate, added: (x.dateAdded || '').slice(0, 10)
    });
    lists[key] = [...shows.values()];
    console.log(label + ':', lists[key].length);
  }

  // 3) Download
  const data = { fetched: new Date().toISOString(), diary, lists };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  a.download = 'serializd-export.json';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Fertig! serializd-export.json wurde heruntergeladen.');
})();
