/* Satranc arayuzu - duz ES3 (BlackBerry OS 5 / Symbian uyumlu). Motor: satranc_motor.js */
(function () {
  var E = ChessEngine;
  var human = 1, colorPref = 1, flip = false, sel = -1, targets = [], over = false, busy = false;
  var lastFrom = -1, lastTo = -1, level = 1, sanList = [], pend = null;
  var cells = [], imgs = [], rankLab = [], fileLab = [];
  var LV = [
    { name: 'Kolay', d: 1, noise: 150, sec: 5 },
    { name: 'Orta', d: 2, noise: 12, sec: 10 },
    { name: 'G\u00fc\u00e7l\u00fc', d: 4, noise: 0, sec: 15 }
  ];
  var NAMES = 'pnbrqk';
  var FILES = 'abcdefgh';
  var pre = [];
  var gen = 0;

  function $(id) { return document.getElementById(id); }
  /* kucuk ekran (BlackBerry 320 px vb.): 28 px kare + kucuk tas seti; digerlerinde 32 px */
  var small = false;
  try { small = (screen.width || 9999) <= 340; } catch (e) {}
  /* tahta boyutlari: 32 / 28 / 24 / 20 px kare. Varsayilan: kucuk ekranda 24, digerlerinde 32.
     "Tahta" dugmesiyle degisir, secim hatirlanir. */
  var SIZES = [32, 28, 24, 20], SDIRS = ['img/', 'img/s28/', 'img/s24/', 'img/s20/'];
  var si = small ? 2 : 0, SZ = SIZES[si], PDIR = SDIRS[si], sv = parseInt(sget('chsz'), 10);
  if (sv >= 0 && sv < SIZES.length) { si = sv; SZ = SIZES[si]; PDIR = SDIRS[si]; }
  if (small) { addClass(document.body, 'bsm'); }
  function bodySize() {
    var i;
    for (i = 0; i < SIZES.length; i++) { removeClass(document.body, 'b' + SIZES[i]); }
    addClass(document.body, 'b' + SZ);
  }
  bodySize();

  function pimg(p) { return p === 0 ? 'blank' : 'p_' + (p > 0 ? 'w' : 'b') + NAMES.charAt((p < 0 ? -p : p) - 1); }

  function setHtml(id, h) { var e = $(id); if (e) e.innerHTML = h; }
  function status(h) { setHtml('status', h); }

  function sqOf(r, c) {
    var f = flip ? 7 - c : c, rk = flip ? r : 7 - r;
    return rk * 8 + f;
  }

  function build() {
    var tb = $('bd'), r, c, tr, td, a, im, i, imgBase = 'img/';
    for (r = 0; r < 8; r++) {
      tr = document.createElement('tr');
      td = document.createElement('td'); td.className = 'co';
      td.appendChild(document.createTextNode('8'));
      rankLab[r] = td; tr.appendChild(td);
      for (c = 0; c < 8; c++) {
        td = document.createElement('td'); td.className = 'sq l';
        a = document.createElement('a'); a.href = '#';
        im = document.createElement('img');
        im.src = imgBase + 'blank.gif'; im.width = SZ; im.height = SZ; im.alt = '';
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
    for (i = 0; i < 12; i++) { pre[i] = new Image(); pre[i].src = PDIR + 'p_' + (i < 6 ? 'w' : 'b') + NAMES.charAt(i % 6) + '.gif'; }
  }

  function clickFn(r, c) { return function () { onSquare(sqOf(r, c)); return false; }; }

  function render() {
    var r, c, s, p, cls, base, ks = -1, chk = E.inCheck(), i, name;
    if (chk) ks = E.kingSq(E.side());
    for (r = 0; r < 8; r++) {
      rankLab[r].firstChild.nodeValue = String(flip ? r + 1 : 8 - r);
      for (c = 0; c < 8; c++) {
        s = sqOf(r, c); p = E.get(s);
        base = (((s >> 3) + (s & 7)) % 2 === 0) ? 'sq d' : 'sq l';
        cls = base;
        if (s === lastFrom || s === lastTo) cls += ' lm';
        for (i = 0; i < targets.length; i++) if (targets[i] === s) cls += ' tg';
        if (s === sel) cls += ' sel';
        if (s === ks) cls += ' chk';
        if (cells[r * 8 + c].className !== cls) cells[r * 8 + c].className = cls;
        name = (p === 0 ? 'img/' : PDIR) + pimg(p) + '.gif';
        if (imgs[r * 8 + c].getAttribute('data-p') !== name) {
          imgs[r * 8 + c].src = name; imgs[r * 8 + c].setAttribute('data-p', name);
        }
      }
    }
    for (c = 0; c < 8; c++) fileLab[c].firstChild.nodeValue = FILES.charAt(flip ? 7 - c : c);
  }

  function movesText() {
    var i, h = '';
    for (i = 0; i < sanList.length; i++) {
      if (i % 2 === 0) h += (i / 2 + 1) + '. ';
      h += sanList[i] + ' ';
    }
    setHtml('moves', h === '' ? '&nbsp;' : h);
  }

  function labels() {
    setHtml('lv', LV[level].name);
    setHtml('cl', colorPref === 1 ? 'Beyaz' : 'Siyah');
    setHtml('sz', String(SZ));
  }

  function turnMsg() {
    var t = E.side() === human ? 'S\u0131ra sende' : 'S\u0131ra botta';
    status(t + (E.inCheck() ? ' - <b>\u015eah!</b>' : '.'));
  }

  function checkEnd() {
    if (E.legalMoves().length === 0) {
      over = true;
      if (E.inCheck()) status('<b>Mat!</b> ' + (E.side() === human ? 'Bot kazand\u0131.' : 'Sen kazand\u0131n.'));
      else status('<b>Pat</b> - berabere.');
    } else if (E.half() >= 100) { over = true; status('<b>Berabere</b> (50 hamle kural\u0131).'); }
    else if (E.repeats() >= 3) { over = true; status('<b>Berabere</b> (3 kez tekrar).'); }
    else if (E.insufficient()) { over = true; status('<b>Berabere</b> (yetersiz materyal).'); }
    return over;
  }

  function doMove(m, bot) {
    var s = E.san(m);
    E.play(m);
    sanList.push(s);
    lastFrom = m & 63; lastTo = (m >> 6) & 63;
    sel = -1; targets = []; pend = null;
    setHtml('promo', ''); $('promo').style.display = 'none';
    render(); movesText();
    if (checkEnd()) { busy = false; return; }
    if (bot) { busy = false; turnMsg(); }
    else { turnMsg(); busy = true; var g0 = gen; setTimeout(function () { if (g0 === gen) startBot(); }, 40); }
  }

  function startBot() {
    var L = LV[level];
    status('Bot d\u00fc\u015f\u00fcn\u00fcyor...');
    var g = gen;
    E.rootStart(L.d, L.noise, L.sec * 1000);
    setTimeout(function () { step(g); }, 20);
  }

  function step(g) {
    if (g !== gen) return;
    var more = E.rootStep(), inf = E.rootInfo();
    if (more) {
      status('Bot d\u00fc\u015f\u00fcn\u00fcyor... (' + inf[0] + '/' + inf[1] + ')');
      setTimeout(function () { step(g); }, 5);
    } else doMove(E.rootBest(), true);
  }

  function movesFrom(s) {
    var L = E.legalMoves(), out = [], i;
    for (i = 0; i < L.length; i++) if ((L[i] & 63) === s) out.push(L[i]);
    return out;
  }

  function onSquare(s) {
    if (busy || over || pend) return;
    var p = E.get(s), mv, i, found = [];
    if (E.side() !== human) return;
    if (sel >= 0) {
      mv = movesFrom(sel);
      for (i = 0; i < mv.length; i++) if (((mv[i] >> 6) & 63) === s) found.push(mv[i]);
      if (found.length > 0) {
        if (found.length > 1) { askPromo(found); return; }
        doMove(found[0], false);
        return;
      }
    }
    if (p * human > 0 && s !== sel) {
      sel = s; targets = [];
      mv = movesFrom(s);
      for (i = 0; i < mv.length; i++) targets.push((mv[i] >> 6) & 63);
    } else { sel = -1; targets = []; }
    render();
  }

  function askPromo(list) {
    var i, h = 'Terfi se\u00e7: ', nm = { 5: 'Vezir', 4: 'Kale', 3: 'Fil', 2: 'At' };
    pend = list;
    for (i = 0; i < list.length; i++) h += '<a href="#" onclick="return ChessUI.promo(' + (list[i] >> 12) + ')">' + nm[list[i] >> 12] + '</a> &nbsp; ';
    setHtml('promo', h); $('promo').style.display = 'block';
  }

  function promo(t) {
    var i;
    if (!pend) return false;
    for (i = 0; i < pend.length; i++) if ((pend[i] >> 12) === t) { var m = pend[i]; pend = null; doMove(m, false); break; }
    return false;
  }

  function newGame() {
    gen++;
    E.reset(); sanList = []; sel = -1; targets = []; over = false; busy = false; pend = null;
    lastFrom = -1; lastTo = -1;
    human = colorPref; flip = human === -1;
    setHtml('promo', ''); $('promo').style.display = 'none';
    render(); movesText(); labels();
    if (human === -1) { busy = true; startBot(); } else turnMsg();
    return false;
  }

  function undo() {
    if (busy) return false;
    var n = 0;
    while (E.plies() > 0) {
      E.undo(); sanList.pop(); n++;
      if (E.side() === human) break;
    }
    if (n > 0) { over = false; sel = -1; targets = []; lastFrom = -1; lastTo = -1; pend = null; setHtml('promo', ''); $('promo').style.display = 'none'; render(); movesText(); turnMsg(); }
    return false;
  }

  function setLevel() { if (busy) return false; level = (level + 1) % LV.length; labels(); return false; }
  function setColor() { colorPref = -colorPref; labels(); return false; }
  function setSize() {
    var i, j;
    si = (si + 1) % SIZES.length; SZ = SIZES[si]; PDIR = SDIRS[si];
    sset('chsz', si);
    bodySize();
    for (i = 0; i < 64; i++) {
      imgs[i].width = SZ; imgs[i].height = SZ;
      imgs[i].setAttribute('data-p', '');
    }
    for (j = 0; j < 12; j++) { pre[j] = new Image(); pre[j].src = PDIR + 'p_' + (j < 6 ? 'w' : 'b') + NAMES.charAt(j % 6) + '.gif'; }
    labels(); render();
    return false;
  }

  function init() {
    build(); labels(); render(); movesText();
    $('game').style.display = 'block';
    var nj = $('nojs'); if (nj) nj.style.display = 'none';
    turnMsg();
  }

  window.ChessUI = { promo: promo, newGame: newGame, undo: undo, level: setLevel, color: setColor, size: setSize };
  if (window.addEventListener) window.addEventListener('load', init, false);
  else window.onload = init;
})();
