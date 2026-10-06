/* Puzzl · overall stats
   Reads the stats each game already saves and shows them under the game cards.
   Add to index.html with one line, just before </body>:
     <script src="stats.js"></script>
   It uses GAMES, get, londonNow, dayNumber and RESET_HOUR from the main script. */
(() => {
  const css = `
  .stats{margin-top:40px}
  .stats .head{margin-bottom:14px}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .tile{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px 16px 14px}
  .tile b{display:block;font:400 34px/1 var(--serif);background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:4px}
  .tile span{display:block;font:500 11px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:6px}
  .tile small{display:block;font-size:13px;color:var(--ice);margin-top:6px;min-height:1.3em}
  .rows{margin-top:12px;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .row{display:grid;grid-template-columns:minmax(0,1.6fr) .8fr 1.3fr .8fr .8fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--line);font:400 14px var(--mono);color:var(--ice);text-decoration:none}
  .row:first-child{border-top:0}
  a.row:hover{background:var(--panel2)}
  .row.th{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:10px;padding-bottom:10px;background:rgba(150,165,230,.05)}
  .row .g{display:flex;align-items:center;gap:10px;font:400 18px var(--serif);color:var(--text);min-width:0}
  .row .g i{width:10px;height:10px;border-radius:50%;background:var(--c);flex:none}
  .row .g em{font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .row .n{text-align:right}
  .row .hot{color:var(--text)}
  .stats-empty{background:var(--panel);border:1px dashed var(--line2);border-radius:16px;padding:22px;color:var(--ice);text-align:center}
  .stats-note{margin-top:10px;font-size:12px;color:var(--muted)}
  @media (max-width:860px){.tiles{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:600px){
    .stats{margin-top:32px}
    .tile{padding:14px}
    .tile b{font-size:30px}
    .row{grid-template-columns:minmax(0,1.5fr) .7fr 1.25fr .75fr;padding:11px 12px;font-size:13px;gap:8px}
    .row .best{display:none}
    .row .g{font-size:16px;gap:8px;line-height:1.15}
    .row .g em{white-space:normal}
  }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  const sec = document.createElement('section');
  sec.className = 'stats'; sec.id = 'stats';
  document.querySelector('.foot-site').before(sec);

  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  /* One line per game: played, current streak, best streak, and a headline record */
  function line(g, d) {
    switch (g.id) {
      case 'dub': {
        const s = get('dtl-stats-v2') || {}, p = s.played || 0;
        return {played: p, streak: s.lastDay >= d - 1 ? s.streak || 0 : 0, best: s.best || 0,
                record: p ? `avg ${Math.round((s.total || 0) / p)}/30` : '–'};
      }
      case 'geo': {
        const s = get('geoclue-stats') || {}, p = s.played || 0;
        return {played: p, streak: s.lastWon >= d - 1 ? s.streak || 0 : 0, best: s.max || 0,
                record: p ? `${pct(s.won || 0, p)}% found` : '–'};
      }
      case 'ridl': {
        const s = get('ridlrush-stats') || {}, p = s.played || 0;
        return {played: p, streak: s.lastDay >= d - 1 ? s.streak || 0 : 0, best: s.best || 0,
                record: p ? `${s.perfect || 0} perfect` : '–'};
      }
      default: {
        const key = {peck: 'pecking-stats', teth: 'tethered-stats', code: 'codebreaker-stats'}[g.id];
        const word = {peck: 'sorted', teth: 'tied', code: 'cracked'}[g.id];
        const s = get(key) || {}, p = s.played || 0;
        return {played: p, streak: s.lastDay >= d - 1 ? s.streak || 0 : 0, best: s.best || 0,
                record: p ? `${pct(s.wins || 0, p)}% ${word}` : '–'};
      }
    }
  }

  /* Full houses: days you finished all six. The games don't record this,
     so Puzzl counts it itself whenever you open the homepage on that day. */
  function dateKey(offsetDays) {
    const o = londonNow(RESET_HOUR);
    return new Date(Date.UTC(+o.year, +o.month - 1, +o.day + offsetDays)).toISOString().slice(0, 10);
  }
  function fullHouses(allDone) {
    let h = get('puzzl-hub') || {};
    h = {full: h.full || 0, streak: h.streak || 0, best: h.best || 0, last: h.last || ''};
    const today = dateKey(0), yday = dateKey(-1);
    if (allDone && h.last !== today) {
      h.full++; h.streak = h.last === yday ? h.streak + 1 : 1; h.best = Math.max(h.best, h.streak); h.last = today;
      try { localStorage.setItem('puzzl-hub', JSON.stringify(h)); } catch (e) {}
    }
    h.current = h.last === today || h.last === yday ? h.streak : 0;
    return h;
  }

  function renderStats() {
    const rows = GAMES.map(g => {
      const d = dayNumber(g.launch);
      let r = {played: 0, streak: 0, best: 0, record: '–'}, done = false;
      try { r = line(g, d); } catch (e) {}
      try { done = !!g.read(d).done; } catch (e) {}
      return Object.assign({g, done}, r);
    });
    const h = fullHouses(rows.every(r => r.done));
    const total = rows.reduce((a, r) => a + r.played, 0);

    if (!total) {
      sec.innerHTML = `<div class="head"><h2>Your stats</h2></div>
        <div class="stats-empty">Play any puzzle and your stats will start building here.</div>`;
      return;
    }
    const alive = rows.filter(r => r.streak > 0).length;
    const top = rows.reduce((a, r) => r.best > a.best ? r : a, rows[0]);
    sec.innerHTML = `
      <div class="head"><h2>Your stats</h2></div>
      <div class="tiles">
        <div class="tile"><b>${total}</b><span>Puzzles played</span><small>across all six games</small></div>
        <div class="tile"><b>${alive}/6</b><span>Streaks alive</span><small>${alive === 6 ? 'Every one. Lovely.' : alive ? 'Keep them going' : 'Start one today'}</small></div>
        <div class="tile"><b>${top.best}</b><span>Best streak</span><small>${top.best ? top.g.name : '&nbsp;'}</small></div>
        <div class="tile"><b>${h.full}</b><span>Full houses</span><small>${h.current > 1 ? `${h.current} days running` : 'All six in a day'}</small></div>
      </div>
      <div class="rows">
        <div class="row th"><span>Game</span><span class="n">Played</span><span class="n">Record</span><span class="n">Streak</span><span class="n best">Best</span></div>
        ${rows.map(r => `
        <a class="row" href="${r.g.url}">
          <span class="g"><i style="--c:${COLOURS[r.g.id]}"></i><em>${r.g.name}</em></span>
          <span class="n">${r.played}</span>
          <span class="n">${r.record}</span>
          <span class="n${r.streak ? ' hot' : ''}">${r.streak ? '🔥 ' + r.streak : '0'}</span>
          <span class="n best">${r.best}</span>
        </a>`).join('')}
      </div>
      <p class="stats-note">Stats are saved on this device and browser.</p>`;
  }

  renderStats();
  window.addEventListener('pageshow', renderStats);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderStats(); });
  window.addEventListener('storage', renderStats);
})();
