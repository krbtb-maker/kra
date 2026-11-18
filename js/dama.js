/* Dama (Turk daması) - ES3 (BlackBerry OS 5 / Symbian uyumlu). Motor + arayuz tek dosyada.
   Kurallar: tas ileri ya da yana 1 kare gider; yakalama (ileri/yana atlayarak) ZORUNLU ve en cok tas alan yol secilir.
   Son siraya ulasan tas dama olur: her yonde istedigi kadar gider, yakalarken tasin ardindaki bos karelerden birine iner.
   Yakalanan taslar hamle bitince alinir; ayni tas iki kez atlanamaz. Rakibin tum taslarini bitiren / hamlesiz birakan kazanir. */
(function () {
  var DR = [-1, 0, 0, 1], DC = [0, -1, 1, 0], OPP = [3, 2, 1, 0];   /* yukari, sol, sag, asagi */
  var b = [], side = 1, human = 1, colorPref = 1, level = 1, flip = false;
  var sel = -1, targets = [], lastFrom = -1, lastTo = -1, over = false, busy = false, gen = 0;
  var half = 0, hist = [], sanList = [];
  var cells = [], imgs = [], rankLab = [], fileLab = [];
  var LV = [
    { name: 'Kolay', d: 2, noise: 90, ms: 300 },
    { name: 'Orta', d: 5, noise: 8, ms: 1500 },
    { name: 'Güçlü', d: 12, noise: 0, ms: 4000 }
  ];
  var INF = 100000, nodes = 0, deadline = 0, aborted = false;

  function $(id) { return document.getElementById(id); }
  function setHtml(id, h) { var e = $(id); if (e) { e.innerHTML = h; } }
  function status(h) { setHtml('status', h); }

  /* ---------- tahta boyutu (satrancla ayni css siniflari) ---------- */
  var small = false;
  try { small = (screen.width || 9999) <= 340; } catch (e0) {}
  var SIZES = [32, 28, 24, 20], si = small ? 2 : 0, SZ = SIZES[si], sv = parseInt(sget('dmsz'), 10);
  if (sv >= 0 && sv < SIZES.length) { si = sv; SZ = SIZES[si]; }
  if (small) { addClass(document.body, 'bsm'); }
  function bodySize() {
    var i;
    for (i = 0; i < SIZES.length; i++) { removeClass(document.body, 'b' + SIZES[i]); }
    addClass(document.body, 'b' + SZ);
  }
  bodySize();
  (function () { var v = parseInt(sget('dmlv'), 10), c = sget('dmcl'); if (v >= 0 && v < LV.length) { level = v; } if (c === '-1') { colorPref = -1; } })();

  /* ---------- kurallar ---------- */
  function setup() {
    var i;
    b = [];
    for (i = 0; i < 64; i++) { b.push(0); }
    for (i = 8; i < 24; i++) { b[i] = -1; }
    for (i = 40; i < 56; i++) { b[i] = 1; }
    side = 1; half = 0;
  }
  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function isCap(arr, sq) { var i; for (i = 0; i < arr.length; i++) { if (arr[i] === sq) { return true; } } return false; }

  /* tek tasin yakalama dizilerini out'a ekle */
  function capRec(bd, sd, sq0, sq, king, capd, path, dl, out) {
    var d, r, c, nr, nc, x, y, found = false, np, nc2;
    for (d = 0; d < 4; d++) {
      if (!king && ((sd === 1 && d === 3) || (sd === -1 && d === 0))) { continue; }
      if (king && dl >= 0 && d === OPP[dl]) { continue; }
      r = (sq >> 3) + DR[d]; c = (sq & 7) + DC[d];
      if (!inb(r, c)) { continue; }
      x = r * 8 + c;
      if (king) {
        while (bd[x] === 0 || x === sq0) {
          r += DR[d]; c += DC[d];
          if (!inb(r, c)) { x = -1; break; }
          x = r * 8 + c;
        }
        if (x < 0) { continue; }
      }
      if (bd[x] * sd >= 0 || isCap(capd, x)) { continue; }
      r = (x >> 3) + DR[d]; c = (x & 7) + DC[d];
      while (inb(r, c) && (bd[r * 8 + c] === 0 || r * 8 + c === sq0)) {
        y = r * 8 + c; found = true;
        nc2 = capd.concat([x]); np = path.concat([y]);
        capRec(bd, sd, sq0, y, king, nc2, np, d, out);
        if (!king) { break; }
        r += DR[d]; c += DC[d];
      }
    }
    if (!found && capd.length > 0) { out.push({ f: sq0, t: sq, caps: capd, n: capd.length, path: path }); }
  }

  function genMoves(bd, sd) {
    var caps = [], quiet = [], sq, p, king, d, r, c, x, mx = 0, i, res;
    for (sq = 0; sq < 64; sq++) {
      p = bd[sq];
      if (p * sd <= 0) { continue; }
      king = (p === 2 || p === -2);
      capRec(bd, sd, sq, sq, king, [], [], -1, caps);
    }
    if (caps.length) {
      for (i = 0; i < caps.length; i++) { if (caps[i].n > mx) { mx = caps[i].n; } }
      res = [];
      for (i = 0; i < caps.length; i++) { if (caps[i].n === mx) { res.push(caps[i]); } }
      return res;
    }
    for (sq = 0; sq < 64; sq++) {
      p = bd[sq];
      if (p * sd <= 0) { continue; }
      king = (p === 2 || p === -2);
      for (d = 0; d < 4; d++) {
        if (!king && ((sd === 1 && d === 3) || (sd === -1 && d === 0))) { continue; }
        r = (sq >> 3) + DR[d]; c = (sq & 7) + DC[d];
        while (inb(r, c) && bd[r * 8 + c] === 0) {
          x = r * 8 + c;
          quiet.push({ f: sq, t: x, caps: [], n: 0, path: [x] });
          if (!king) { break; }
          r += DR[d]; c += DC[d];
        }
      }
    }
    return quiet;
  }

  /* hamleyi uygula; geri alma bilgisi dondur */
  function doMove(bd, m) {
    var p = bd[m.f], saved = [], i, tr = m.t >> 3, np = p;
    for (i = 0; i < m.caps.length; i++) { saved.push(bd[m.caps[i]]); bd[m.caps[i]] = 0; }
    bd[m.f] = 0;
    if ((p === 1 && tr === 0) || (p === -1 && tr === 7)) { np = p * 2; }
    bd[m.t] = np;
    return { p: p, saved: saved };
  }
  function undoMove(bd, m, u) {
    var i;
    bd[m.t] = 0; bd[m.f] = u.p;
    for (i = 0; i < m.caps.length; i++) { bd[m.caps[i]] = u.saved[i]; }
  }

  /* ---------- degerlendirme (beyaz lehine pozitif) ---------- */
  function evaluate(bd) {
    var s = 0, sq, p, r, c;
    for (sq = 0; sq < 64; sq++) {
      p = bd[sq];
      if (p === 0) { continue; }
      r = sq >> 3; c = sq & 7;
      if (p === 1) { s += 100 + (7 - r) * 7; }
      else if (p === -1) { s -= 100 + r * 7; }
      else if (p === 2) { s += 330 - (Math.abs(c - 3.5) + Math.abs(r - 3.5)) * 2; }
      else { s -= 330 - (Math.abs(c - 3.5) + Math.abs(r - 3.5)) * 2; }
    }
    return s;
  }

  function nega(bd, sd, depth, alpha, beta, ply) {
    var mv, i, sc, best, u;
    nodes++;
    if ((nodes & 63) === 0 && (new Date()).getTime() > deadline) { aborted = true; }
    if (aborted) { return 0; }
    mv = genMoves(bd, sd);
    if (mv.length === 0) { return -INF + ply; }
    if (depth <= 0 && (mv[0].n === 0 || ply > 24)) { return sd * evaluate(bd); }
    best = -INF;
    for (i = 0; i < mv.length; i++) {
      u = doMove(bd, mv[i]);
      sc = -nega(bd, -sd, depth - 1, -beta, -alpha, ply + 1);
      undoMove(bd, mv[i], u);
      if (aborted) { return 0; }
      if (sc > best) { best = sc; }
      if (best > alpha) { alpha = best; }
      if (alpha >= beta) { break; }
    }
    return best;
  }

  function search(L) {
    var root = genMoves(b, side), best = null, d, i, sc, bs, u, cand, bi, tmp, scores;
    if (root.length === 1) { return root[0]; }
    deadline = (new Date()).getTime() + L.ms; aborted = false; nodes = 0;
    best = root[Math.floor(Math.random() * root.length)];
    for (d = 1; d <= L.d; d++) {
      bs = -INF - 1; cand = null; scores = [];
      for (i = 0; i < root.length; i++) {
        u = doMove(b, root[i]);
        sc = -nega(b, -side, d - 1, -INF, INF, 1);
        undoMove(b, root[i], u);
        if (aborted) { break; }
        sc += Math.random() * L.noise;
        scores.push(sc);
        if (sc > bs) { bs = sc; cand = root[i]; bi = i; }
      }
      if (aborted) { break; }
      best = cand;
      if (bi > 0) { tmp = root[0]; root[0] = root[bi]; root[bi] = tmp; }   /* en iyi hamle bir sonraki turda one */
      if (bs > INF / 2 || bs < -INF / 2) { break; }
    }
    return best;
  }

  /* ---------- arayuz ---------- */
  function sqName(s) { return 'abcdefgh'.charAt(s & 7) + String(8 - (s >> 3)); }
  function san(m) {
    var h = sqName(m.f), i;
    if (m.n === 0) { return h + '-' + sqName(m.t); }
    for (i = 0; i < m.path.length; i++) { h += 'x' + sqName(m.path[i]); }
    return h;
  }
  function sqOf(r, c) { return flip ? 63 - (r * 8 + c) : r * 8 + c; }
  function pname(p) { return p === 0 ? 'img/blank.gif' : 'img/dama/d_' + (p > 0 ? 'w' : 'b') + (p === 2 || p === -2 ? 'k' : 'm') + '_' + SZ + '.gif'; }

  function build() {
    var tb = $('bd'), r, c, tr, td, a, im, i;
    while (tb.firstChild) { tb.removeChild(tb.firstChild); }
    cells = []; imgs = []; rankLab = []; fileLab = [];
    for (r = 0; r < 8; r++) {
      tr = document.createElement('tr');
      td = document.createElement('td'); td.className = 'co';
      td.appendChild(document.createTextNode('8'));
      rankLab[r] = td; tr.appendChild(td);
      for (c = 0; c < 8; c++) {
        td = document.createElement('td'); td.className = 'sq l';
        a = document.createElement('a'); a.href = '#';
        im = document.createElement('img');
        im.src = 'img/blank.gif'; im.width = SZ; im.height = SZ; im.alt = '';
        a.appendChild(im); td.appendChild(a); tr.appendChild(td);
        a.onclick = clickFn(r, c);
        cells[r * 8 + c] = td; imgs[r * 8 + c] = im;
      }
      tb.appendChild(tr);
    }
    tr = document.createElement('tr');
    td = document.createElement('td'); td.className = 'co'; tr.appendChild(td);
    for (c = 0; c < 8; c++) {
      td = document.createElement('td'); td.className = 'co';
      td.appendChild(document.createTextNode('a'));
      fileLab[c] = td; tr.appendChild(td);
    }
    tb.appendChild(tr);
    for (i = 0; i < 4; i++) { (new Image()).src = pname([1, -1, 2, -2][i]); }
  }
  function clickFn(r, c) { return function () { onSquare(sqOf(r, c)); return false; }; }

  function render() {
    var r, c, s, cls, name, i, k;
    for (r = 0; r < 8; r++) {
      rankLab[r].firstChild.nodeValue = String(flip ? r + 1 : 8 - r);
      for (c = 0; c < 8; c++) {
        s = sqOf(r, c); k = r * 8 + c;
        cls = 'sq l';
        if (s === lastFrom || s === lastTo) { cls += ' lm'; }
        for (i = 0; i < targets.length; i++) { if (targets[i] === s) { cls += ' tg'; } }
        if (s === sel) { cls += ' sel'; }
        if (cells[k].className !== cls) { cells[k].className = cls; }
        name = pname(b[s]);
        if (imgs[k].getAttribute('data-p') !== name) { imgs[k].src = name; imgs[k].setAttribute('data-p', name); }
      }
    }
    for (c = 0; c < 8; c++) { fileLab[c].firstChild.nodeValue = 'abcdefgh'.charAt(flip ? 7 - c : c); }
  }

  function count(sd) { var n = 0, i; for (i = 0; i < 64; i++) { if (b[i] * sd > 0) { n++; } } return n; }
  function labels() {
    setHtml('dlv', LV[level].name);
    setHtml('dcl', colorPref === 1 ? 'Beyaz' : 'Siyah');
    setHtml('dsz', String(SZ));
  }
  function movesText() {
    var i, h = '';
    for (i = 0; i < sanList.length; i++) {
      if (i % 2 === 0) { h += (i / 2 + 1) + '. '; }
      h += sanList[i] + ' ';
    }
    setHtml('moves', h === '' ? '&nbsp;' : h);
  }
  function turnMsg() {
    var mine = count(human), his = count(-human), mv, t;
    t = (side === human ? 'Sıra sende' : 'Sıra botta') + ' &nbsp; (Sen: <b>' + mine + '</b>, Bot: <b>' + his + '</b>)';
    if (side === human) {
      mv = genMoves(b, side);
      if (mv.length && mv[0].n > 0) { t += '<br><b>Zorunlu yakalama!</b> En çok taş alan yolu izlemelisin.'; }
    }
    status(t);
  }

  function checkEnd() {
    var mv = genMoves(b, side);
    if (mv.length === 0) {
      over = true;
      status('<b>' + (side === human ? 'Bot kazandı.' : 'Sen kazandın!') + '</b> ' + (count(side) === 0 ? 'Tüm taşlar alındı.' : 'Hamle kalmadı.'));
    } else if (half >= 100) { over = true; status('<b>Berabere</b> (100 hamlede yakalama/taş hamlesi yok).'); }
    return over;
  }

  function play(m, bot) {
    var p = b[m.f];
    if (!bot) { hist.push({ b: b.slice(0), side: side, half: half, lf: lastFrom, lt: lastTo, san: sanList.length }); }
    doMove(b, m);
    if (m.n > 0 || p === 1 || p === -1) { half = 0; } else { half++; }
    side = -side;
    sanList.push(san(m));
    lastFrom = m.f; lastTo = m.t; sel = -1; targets = [];
    render(); movesText();
    if (checkEnd()) { busy = false; return; }
    if (bot) { busy = false; turnMsg(); }
    else {
      busy = true; status('Bot düşünüyor...');
      var g = gen; setTimeout(function () { if (g === gen) { botMove(g); } }, 60);
    }
  }
  function botMove(g) {
    var m;
    if (g !== gen) { return; }
    try { m = search(LV[level]); } catch (e) { m = genMoves(b, side)[0]; }
    if (g !== gen) { return; }
    play(m, true);
  }

  function movesFrom(s) {
    var L = genMoves(b, side), out = [], i;
    for (i = 0; i < L.length; i++) { if (L[i].f === s) { out.push(L[i]); } }
    return out;
  }
  function onSquare(s) {
    var mv, i, found = null;
    if (busy || over || side !== human) { return; }
    if (sel >= 0) {
      mv = movesFrom(sel);
      for (i = 0; i < mv.length; i++) { if (mv[i].t === s) { found = mv[i]; break; } }
      if (found) { play(found, false); return; }
    }
    if (b[s] * human > 0 && s !== sel) {
      mv = movesFrom(s);
      if (mv.length === 0) {
        sel = -1; targets = [];
        status('Bu taşın hamlesi yok' + (genMoves(b, side)[0].n > 0 ? ' (başka bir taşla yakalama zorunlu).' : '.'));
        render(); return;
      }
      sel = s; targets = [];
      for (i = 0; i < mv.length; i++) { targets.push(mv[i].t); }
      turnMsg();
    } else { sel = -1; targets = []; turnMsg(); }
    render();
  }

  function newGame() {
    gen++;
    human = colorPref; flip = (human === -1);
    setup(); hist = []; sanList = []; sel = -1; targets = []; lastFrom = -1; lastTo = -1; over = false; busy = false;
    build(); render(); movesText(); labels();
    if (side !== human) { busy = true; status('Bot düşünüyor...'); var g = gen; setTimeout(function () { botMove(g); }, 80); }
    else { turnMsg(); }
    return false;
  }

  function undo() {
    var h;
    if (busy || hist.length === 0) { return false; }
    gen++;
    h = hist.pop();
    b = h.b; side = h.side; half = h.half; lastFrom = h.lf; lastTo = h.lt;
    sanList.length = h.san; sel = -1; targets = []; over = false; busy = false;
    render(); movesText(); turnMsg();
    return false;
  }
  function lev() { level = (level + 1) % LV.length; sset('dmlv', level); labels(); return false; }
  function color() { colorPref = -colorPref; sset('dmcl', colorPref); labels(); return false; }
  function size() {
    si = (si + 1) % SIZES.length; SZ = SIZES[si]; sset('dmsz', si); bodySize();
    build(); render(); labels();
    return false;
  }

  function init() {
    newGame();
    $('game').style.display = 'block';
    var nj = $('nojs'); if (nj) { nj.style.display = 'none'; }
  }
  window.Dama = { newGame: newGame, undo: undo, level: lev, color: color, size: size, _t: { gen: genMoves, setup: setup, get: function () { return b; }, set: function (x, s) { b = x; side = s; }, search: search } };
  if (window.addEventListener) { window.addEventListener('load', init, false); } else { window.onload = init; }
})();
