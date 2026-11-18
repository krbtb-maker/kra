/* Piksel sanat editoru - ES3 (BlackBerry OS 5 / Symbian uyumlu). Canvas yok.
   Tuval 15/30/45/60/90 kare; ekranda 15x15'lik kaydirmali pencere (hucre = <a><img>). JPG: pixjpeg.js */
(function () {
  var PAL = [[255,255,255],[0,0,0],[127,127,127],[195,195,195],[136,0,21],[237,28,36],[255,127,39],[255,242,0],[34,177,76],[181,230,29],[0,162,232],[153,217,234],[63,72,204],[112,146,190],[163,73,164],[200,191,231],[185,122,87],[255,174,201],[255,201,14],[239,228,176],[92,51,23],[156,90,60],[245,208,169],[232,168,124],[11,61,11],[75,139,59],[10,42,107],[93,173,226],[74,35,90],[142,68,173],[192,57,43],[26,188,156]];
  var NS = [15, 30, 45, 60, 90], VW = 15, ZS = [10, 14, 18, 22], OS = [1, 4, 8, 16];
  var TN = ['Kalem', 'Silgi', 'Kova', 'Damlalık'];
  var ni = 1, zi, oi = 2, N = 30, data = [], color = 1, tool = 0, pen = false, cx = 0, cy = 0, ox = 0, oy = 0;
  var tdv = [], imv = [], shown = [], prevK = -1, undo = [], needSnap = true, saveT = null, mdown = false, store = {};

  function $(id) { return document.getElementById(id); }
  function setHtml(id, h) { var e = $(id); if (e) { e.innerHTML = h; } }

  /* ---- kayit: localStorage + window.name (cerez degil; 90x90 cerez sinirini asar) ---- */
  function pset(k, v) {
    var m, out, key;
    try { window.localStorage.setItem('fk_' + k, v); } catch (e1) {}
    try {
      m = nameMap(); m[k] = v; out = 'FORUM1';
      for (key in m) { out += '|' + key + '=' + encodeURIComponent(m[key]); }
      window.name = out;
    } catch (e2) {}
  }
  function pget(k) {
    var v = '', m;
    try { v = window.localStorage.getItem('fk_' + k) || ''; } catch (e1) {}
    if (v === '') { try { m = nameMap(); if (m[k] !== undefined) { v = m[k]; } } catch (e2) {} }
    return v;
  }
  var CH = '0123456789abcdefghijklmnopqrstuv';
  function rle(a) {
    var s = [], i = 0, j;
    while (i < a.length) { j = i; while (j < a.length && a[j] === a[i]) { j++; } s.push(CH.charAt(a[i]) + (j - i)); i = j; }
    return s.join(',');
  }
  function unrle(str, len) {
    var out = [], p = str.split(','), i, c, n, k;
    for (i = 0; i < p.length; i++) {
      if (p[i] === '') { continue; }
      c = CH.indexOf(p[i].charAt(0)); n = parseInt(p[i].substring(1), 10);
      if (c < 0 || isNaN(n)) { return null; }
      for (k = 0; k < n; k++) { out.push(c); }
    }
    return out.length === len ? out : null;
  }
  function blank(n) { var a = [], i; for (i = 0; i < n * n; i++) { a.push(0); } return a; }
  function saveNow() { saveT = null; pset('pxd' + N, rle(data)); pset('pxn', ni); }
  function saveSoon() { if (saveT === null) { saveT = setTimeout(saveNow, 1500); } }
  function loadFor(n) {
    var d = store[n], s;
    if (!d) { s = pget('pxd' + n); if (s) { d = unrle(s, n * n); } }
    return d || blank(n);
  }

  /* ---- gorunum ---- */
  function build() {
    var tb = $('pv'), r, c, tr, td, a, im, s = ZS[zi];
    while (tb.firstChild) { tb.removeChild(tb.firstChild); }
    tdv = []; imv = []; shown = []; prevK = -1;
    for (r = 0; r < VW; r++) {
      tr = document.createElement('tr');
      for (c = 0; c < VW; c++) {
        td = document.createElement('td');
        a = document.createElement('a'); a.href = '#';
        im = document.createElement('img'); im.src = 'img/px/c0.gif'; im.width = s; im.height = s; im.alt = '';
        a.appendChild(im); td.appendChild(a); tr.appendChild(td);
        a.onclick = clickFn(c, r); a.onfocus = focusFn(c, r); a.onmouseover = overFn(c, r);
        tdv[r * VW + c] = td; imv[r * VW + c] = im; shown[r * VW + c] = 0;
      }
      tb.appendChild(tr);
    }
  }
  function clickFn(c, r) { return function () { cur(ox + c, oy + r); apply(ox + c, oy + r, true); return false; }; }
  function focusFn(c, r) { return function () { cur(ox + c, oy + r); if (pen && tool < 2) { apply(ox + c, oy + r, false); } }; }
  function overFn(c, r) { return function () { if (mdown && tool < 2) { cur(ox + c, oy + r); apply(ox + c, oy + r, false); } }; }

  function clampView() {
    if (cx < ox) { ox = cx; } else if (cx > ox + VW - 1) { ox = cx - VW + 1; }
    if (cy < oy) { oy = cy; } else if (cy > oy + VW - 1) { oy = cy - VW + 1; }
    if (ox > N - VW) { ox = N - VW; } if (ox < 0) { ox = 0; }
    if (oy > N - VW) { oy = N - VW; } if (oy < 0) { oy = 0; }
  }
  function render() {
    var r, c, k, v, s = ZS[zi], ck;
    for (r = 0; r < VW; r++) {
      for (c = 0; c < VW; c++) {
        k = r * VW + c; v = data[(oy + r) * N + ox + c];
        if (shown[k] !== v) { shown[k] = v; imv[k].src = 'img/px/c' + v + '.gif'; }
      }
    }
    ck = (cy - oy) * VW + (cx - ox);
    if (prevK >= 0 && prevK !== ck) { tdv[prevK].className = ''; imv[prevK].width = s; imv[prevK].height = s; }
    if (ck >= 0 && ck < VW * VW && prevK !== ck) { tdv[ck].className = 'cur'; imv[ck].width = s - 4; imv[ck].height = s - 4; }
    prevK = ck;
    info();
  }
  function cur(x, y) {
    if (x < 0) { x = 0; } if (y < 0) { y = 0; } if (x > N - 1) { x = N - 1; } if (y > N - 1) { y = N - 1; }
    cx = x; cy = y;
    var ox0 = ox, oy0 = oy; clampView();
    if (ox0 !== ox || oy0 !== oy) { prevK = -1; }
    render();
  }
  function info() {
    setHtml('pinfo', 'Tuval: <b>' + N + 'x' + N + '</b> &nbsp; İmleç: <b>' + (cx + 1) + ',' + (cy + 1) + '</b> &nbsp; Araç: <b>' + TN[tool] + '</b>' +
      (pen && tool < 2 ? ' (kalem basılı)' : '') + ' &nbsp; Renk: <img class="pxcol" src="img/px/c' + color + '.gif" width="14" height="14" alt="">');
  }
  function labels() {
    setHtml('ptool', TN[tool]); setHtml('ppen', pen ? 'Basılı' : 'Kalkik'.replace('i', 'ı'));
    setHtml('psz', N + 'x' + N); setHtml('pzm', String(ZS[zi])); setHtml('pos', OS[oi] + 'x (' + (N * OS[oi]) + ' px)');
  }

  /* ---- boyama ---- */
  function snap() {
    undo.push(data.slice(0)); if (undo.length > 25) { undo.shift(); }
  }
  function fill(x, y, v) {
    var t = data[y * N + x], st = [y * N + x], i, px, py;
    if (t === v) { return; }
    while (st.length) {
      i = st.pop();
      if (data[i] !== t) { continue; }
      data[i] = v; px = i % N; py = (i - px) / N;
      if (px > 0) { st.push(i - 1); } if (px < N - 1) { st.push(i + 1); }
      if (py > 0) { st.push(i - N); } if (py < N - 1) { st.push(i + N); }
    }
  }
  function apply(x, y, discrete) {
    var i = y * N + x, v;
    if (tool === 3) { color = data[i]; tool = 0; labels(); render(); return; }
    v = (tool === 1) ? 0 : color;
    if (tool < 2) { if (data[i] === v) { return; } if (discrete || needSnap) { snap(); needSnap = false; } data[i] = v; }
    else { if (data[i] === v) { return; } snap(); fill(x, y, v); }
    if (discrete) { needSnap = true; }
    render(); saveSoon();
  }

  function pick(c) { color = c; if (tool === 1 || tool === 3) { tool = 0; } mark(); labels(); info(); return false; }
  function mark() { var i; for (i = 0; i < 32; i++) { $('pc' + i).className = (i === color) ? 'sel' : ''; } }
  function buildPal() {
    var tb = $('ppal'), r, c, tr, td, a, im, i;
    for (r = 0; r < 4; r++) {
      tr = document.createElement('tr');
      for (c = 0; c < 8; c++) {
        i = r * 8 + c;
        td = document.createElement('td'); td.id = 'pc' + i;
        a = document.createElement('a'); a.href = '#'; a.title = String(i + 1);
        im = document.createElement('img'); im.src = 'img/px/c' + i + '.gif'; im.width = 22; im.height = 18; im.alt = '';
        a.appendChild(im); td.appendChild(a); tr.appendChild(td);
        a.onclick = palFn(i);
      }
      tb.appendChild(tr);
    }
  }
  function palFn(i) { return function () { return pick(i); }; }

  /* ---- dugmeler ---- */
  function move(dx, dy) { cur(cx + dx, cy + dy); if (pen && tool < 2) { apply(cx, cy, false); } return false; }
  function paint() { apply(cx, cy, true); return false; }
  function toolNext() { tool = (tool + 1) % TN.length; labels(); info(); return false; }
  function penToggle() { pen = !pen; if (pen) { needSnap = true; } labels(); info(); return false; }
  function doUndo() {
    if (!undo.length) { return false; }
    data = undo.pop(); needSnap = true; render(); saveSoon(); return false;
  }
  function clearAll() {
    var i, any = false;
    for (i = 0; i < data.length; i++) { if (data[i] !== 0) { any = true; break; } }
    if (!any) { return false; }
    snap(); data = blank(N); needSnap = true; render(); saveSoon();
    return false;
  }
  function canvasSize() {
    if (window.PIX_FIXED) { return false; }
    store[N] = data; saveNow();
    ni = (ni + 1) % NS.length; N = NS[ni];
    data = loadFor(N); undo = []; cx = cy = Math.floor(N / 2); ox = oy = 0; needSnap = true;
    clampView(); build(); prevK = -1; render(); labels(); setHtml('pout', ''); pset('pxn', ni);
    return false;
  }
  function zoom() { zi = (zi + 1) % ZS.length; sset('pxz', zi); build(); prevK = -1; render(); labels(); return false; }
  function outScale() { oi = (oi + 1) % OS.length; sset('pxo', oi); labels(); return false; }

  function makeJpg() {
    setHtml('pout', '<div class="status">JPG oluşturuluyor...</div>');
    setTimeout(function () {
      var r, uri, fname, kb, w;
      try { r = PixJpeg.encode(data, N, OS[oi], PAL); }
      catch (e) { setHtml('pout', '<div class="note"><b>Hata:</b> JPG oluşturulamadı (' + e + ').</div>'); return; }
      uri = 'data:image/jpeg;base64,' + r.b64;
      fname = 'piksel_' + N + 'x' + N + (OS[oi] > 1 ? '_x' + OS[oi] : '') + '.jpg';
      kb = Math.round(r.bytes / 102.4) / 10;
      w = r.w > 280 ? 280 : r.w;
      setHtml('pout', '<div class="status">JPG hazır: <b>' + r.w + 'x' + r.h + ' px</b>, ' + kb + ' KB</div>' +
        '<div><img src="' + uri + '" width="' + w + '" alt="piksel sanat"></div>' +
        '<div class="gbtns"><a class="solbtn" href="' + uri + '" download="' + fname + '">&#9660; Kaydet: ' + fname + '</a></div>' +
        '<div class="note">Kaydetmek i&#231;in resme <b>bas&#305;l&#305; tut / men&#252; tu&#351;u</b> &rarr; <i>Resmi kaydet</i> (Save Image) de; bilgisayarda yukar&#305;daki d&#252;&#287;me dosyay&#305; indirir.</div>');
    }, 30);
    return false;
  }

  function key(k) {
    var t = (window.event && window.event.srcElement) || null;
    if (k === 90) { doUndo(); return true; }
    if (k === 84) { toolNext(); return true; }
    if (k === 80) { penToggle(); return true; }
    if (k === 66) { paint(); return true; }
    return false;
  }

  function init() {
    var v = parseInt(pget('pxn'), 10), z;
    zi = TileDefault(1, 2);
    z = parseInt(sget('pxz'), 10); if (z >= 0 && z < ZS.length) { zi = z; }
    z = parseInt(sget('pxo'), 10); if (z >= 0 && z < OS.length) { oi = z; }
    if (v >= 0 && v < NS.length) { ni = v; }
    if (window.PIX_FIXED) { for (z = 0; z < NS.length; z++) { if (NS[z] === window.PIX_FIXED) { ni = z; } } }
    N = NS[ni]; data = loadFor(N);
    cx = cy = Math.floor(N / 2);
    document.onmouseup = function () { mdown = false; };
    $('pv').onmousedown = function () { mdown = true; needSnap = true; };
    GameKeys(key);
    buildPal(); build(); clampView(); mark(); render(); labels();
    $('game').style.display = 'block';
    var nj = $('nojs'); if (nj) { nj.style.display = 'none'; }
  }
  window.Pix = {
    up: function () { return move(0, -1); }, down: function () { return move(0, 1); }, left: function () { return move(-1, 0); }, right: function () { return move(1, 0); },
    up5: function () { return move(0, -5); }, down5: function () { return move(0, 5); }, left5: function () { return move(-5, 0); }, right5: function () { return move(5, 0); },
    paint: paint, tool: toolNext, pen: penToggle, undo: doUndo, clear: clearAll, size: canvasSize, zoom: zoom, scale: outScale, jpg: makeJpg,
    _t: { data: function () { return data; }, N: function () { return N; } }
  };
  if (window.addEventListener) { window.addEventListener('load', init, false); } else { window.onload = init; }
  if (window.addEventListener) { window.addEventListener('unload', function () { if (saveT !== null) { saveNow(); } }, false); }
})();
