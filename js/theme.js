/* ikra blog - BlackBerry OS 5 / Symbian uyumlu (ES3). Ortak yardimcilar, kayit, tema, menu gorunurlugu.
   Kayit: cookie + localStorage + window.name (hangisi calisirsa). */
function hasClass(el, c) {
  return (' ' + el.className + ' ').indexOf(' ' + c + ' ') > -1;
}
function addClass(el, c) {
  if (!hasClass(el, c)) { el.className = (el.className ? el.className + ' ' : '') + c; }
}
function removeClass(el, c) {
  var s = (' ' + el.className + ' ').split(' ' + c + ' ').join(' ');
  el.className = s.replace(/^\s+|\s+$/g, '');
}

/* ---- kayit ---- */
function nameMap() {
  var m = {}, parts, i, p, eq;
  try {
    if (window.name && window.name.indexOf('FORUM1|') === 0) {
      parts = window.name.split('|');
      for (i = 1; i < parts.length; i++) {
        p = parts[i]; eq = p.indexOf('=');
        if (eq > 0) { m[p.substring(0, eq)] = decodeURIComponent(p.substring(eq + 1)); }
      }
    }
  } catch (e) {}
  return m;
}
function sget(k) {
  var v = '', parts, i, c, m;
  try {
    parts = document.cookie.split(';');
    for (i = 0; i < parts.length; i++) {
      c = parts[i].replace(/^\s+|\s+$/g, '');
      if (c.indexOf('fk_' + k + '=') === 0) { v = decodeURIComponent(c.substring(k.length + 4)); }
    }
  } catch (e1) {}
  if (v === '') { try { v = window.localStorage.getItem('fk_' + k) || ''; } catch (e2) {} }
  if (v === '') { m = nameMap(); if (m[k] !== undefined) { v = m[k]; } }
  return v;
}
function sset(k, v) {
  var d, m, out, key;
  v = String(v);
  try {
    d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = 'fk_' + k + '=' + encodeURIComponent(v) + '; expires=' + d.toUTCString() + '; path=/';
  } catch (e1) {}
  try { window.localStorage.setItem('fk_' + k, v); } catch (e2) {}
  try {
    m = nameMap(); m[k] = v; out = 'FORUM1';
    for (key in m) { out += '|' + key + '=' + encodeURIComponent(m[key]); }
    window.name = out;
  } catch (e3) {}
}

/* ---- tema ---- */
function applyTheme(v) {
  if (v === 'dark') { addClass(document.body, 'dark'); } else { removeClass(document.body, 'dark'); }
}
function toggleTheme() {
  var next = hasClass(document.body, 'dark') ? 'light' : 'dark';
  applyTheme(next);
  sset('tema', next);
  return false;
}

/* ---- menu gorunurlugu ----
   Dar ekranda (telefon) menu acilinca tam genislikte gosterilir (menuonly); bir ogeye
   dokunulunca otomatik gizlenir (smgo). */
function syncMenuOnly() {
  var b = document.body;
  removeClass(b, 'menuonly'); /* dar ekranda da menu yari genislikte, icerik yaninda */
}
function toggleMenu() {
  if (hasClass(document.body, 'nomenu')) { removeClass(document.body, 'nomenu'); sset('menu', '1'); }
  else { addClass(document.body, 'nomenu'); sset('menu', '0'); }
  syncMenuOnly();
  return false;
}
function smgo() {
  if (hasClass(document.body, 'narrow')) { sset('menu', '0'); }
  return true;
}

/* ---- cozumu goster / gizle ---- */
function tg(el) {
  var p = el.parentNode;
  if (hasClass(p, 'open')) { removeClass(p, 'open'); } else { addClass(p, 'open'); }
  return false;
}

/* ---- sabit (sticky) menu: yalnizca tarayici destegini kendisi dogrularsa ---- */
function stickyOk() {
  var d, v = ['sticky', '-webkit-sticky'], i;
  try {
    d = document.createElement('div');
    for (i = 0; i < v.length; i++) {
      d.style.position = '';
      d.style.position = v[i];
      if (d.style.position && d.style.position.indexOf('sticky') > -1) { return true; }
    }
  } catch (e) {}
  return false;
}

/* ---- sayfa acilisinda ---- */
addClass(document.body, 'js');
if (stickyOk()) { addClass(document.body, 'stick'); }
applyTheme(sget('tema') === 'dark' ? 'dark' : 'light');
(function () {
  var pref = sget('menu'), w = 0;
  try { w = screen.width || 0; } catch (e) {}
  if (w > 0 && w <= 480) { addClass(document.body, 'narrow'); if (/Android/i.test(navigator.userAgent || '')) { addClass(document.body, 'andr'); } }
  if (pref === '') { pref = '0'; }  /* varsayilan: menu kapali */
  if (pref === '0') { addClass(document.body, 'nomenu'); }
  syncMenuOnly();
})();


/* ======================================================================
   OKUMA ILERLEMESI (ES3): "Okudum" kutusu + Win95 ilerleme cubugu + ana sayfa tablosu
   Kayit: okunan konularin kisa kimlikleri (5 harf) 1200 karakterlik parcalar halinde sset ile saklanir.
   Agac islevleri (getTree vb.) menu.js'tedir; buradakiler yalniz o yuklendikten sonra cagrilir.
   ====================================================================== */
var OKS = null, OKU = null, OKITEM = null;
function okHash(s) {
  var h = 5381, i, x;
  for (i = 0; i < s.length; i++) { h = (h * 33 + s.charCodeAt(i)) % 4294967296; }
  x = h % 60466176;
  return ('00000' + x.toString(36)).slice(-5);
}
function okId(n) { if (!n.oid) { n.oid = okHash(n.href); } return n.oid; }
function okLoad() {
  var n, s = '', i, o = {};
  if (OKS) { return OKS; }
  n = parseInt(sget('okn'), 10) || 0;
  for (i = 0; i < n; i++) { s += sget('ok' + i); }
  for (i = 0; i + 5 <= s.length; i += 5) { o[s.substring(i, i + 5)] = 1; }
  OKS = o;
  return o;
}
function okSave() {
  var k, s = '', n, i, old = parseInt(sget('okn'), 10) || 0;
  for (k in OKS) { if (OKS[k]) { s += k; } }
  n = Math.ceil(s.length / 1200);
  for (i = 0; i < n; i++) { sset('ok' + i, s.substring(i * 1200, (i + 1) * 1200)); }
  for (i = n; i < old; i++) { sset('ok' + i, ''); }
  sset('okn', n);
}
function okIsLeaf(n) { return !n.kids && !n.game && !/^Yazar/.test(n.t); }
function okIsDone(n) { return okIsLeaf(n) && !!okLoad()[okId(n)]; }
function okCollect(n, out) {
  var i;
  if (n.kids) { for (i = 0; i < n.kids.length; i++) { okCollect(n.kids[i], out); } }
  else if (okIsLeaf(n)) { out.push(n); }
  return out;
}
function okLeaves(n) { if (!n._lv) { n._lv = okCollect(n, []); } return n._lv; }
function okStat(leaves) {
  var d = 0, i, o = okLoad();
  for (i = 0; i < leaves.length; i++) { if (o[okId(leaves[i])]) { d++; } }
  return { d: d, t: leaves.length };
}
function okPct(st) {
  var p;
  if (!st.t || !st.d) { return 0; }
  p = Math.round(st.d * 100 / st.t);
  return p < 1 ? 1 : p;
}
function okBar(st) {
  var p = okPct(st), w = st.d ? (p >= 100 ? 100 : (p < 8 ? 8 : p)) : 0;
  return '<div class="pbo"><div class="pbi" style="width:' + w + 'px"></div></div>';
}
/* ilerleme birimleri: ders/kitap. Klasor alt klasor iceriyorsa her alt klasor ayri birim (TYT Matematik, Hamidullah...) */
function okUnits() {
  var T, a, b, c, top, g, k, folders, direct, u, i;
  if (OKU) { return OKU; }
  OKU = [];
  T = getTree();
  function add(t, ctx, leaves) {
    var j, un = { t: t, ctx: ctx, leaves: leaves };
    for (j = 0; j < leaves.length; j++) { leaves[j]._u = un; }
    if (leaves.length) { OKU.push(un); }
  }
  for (a = 0; a < T.length; a++) {
    top = T[a];
    for (b = 0; b < top.kids.length; b++) {
      g = top.kids[b]; folders = []; direct = [];
      for (c = 0; c < g.kids.length; c++) {
        k = g.kids[c];
        if (k.kids) { folders.push(k); } else { direct.push(k); }
      }
      if (!folders.length) { add(g.t, top.t, okLeaves(g)); }
      else {
        for (i = 0; i < folders.length; i++) { add(folders[i].t, g.t, okLeaves(folders[i])); }
        u = [];
        for (i = 0; i < direct.length; i++) { if (okIsLeaf(direct[i])) { u.push(direct[i]); } }
        add(g.t, top.t, u);
      }
    }
  }
  return OKU;
}
function okLabel(st) {
  return '%' + okPct(st) + ' &middot; ' + st.d + '/' + st.t;
}

/* klasor penceresi durum cubugu: "N nesne" + cubuk + yuzde */
function okFolderStatus(cnt, n) {
  var st;
  try { st = okStat(okLeaves(n)); } catch (e) { return cnt + ' nesne'; }
  if (!st.t) { return cnt + ' nesne'; }
  return '<table class="okst" cellspacing="0" cellpadding="0"><tr><td>' + cnt + ' nesne</td><td class="okb">' + okBar(st) +
    '</td><td class="okr">' + okLabel(st) + '</td></tr></table>';
}
function okMark(n) { return okIsDone(n) ? '<img class="ckm" src="' + MENU_ROOT + 'img/ck.gif" width="9" height="9" alt="">' : ''; }

/* konu sayfasinin penceresi: altta "Okudum" kutusu + bu dersin/kitabin ilerleme cubugu */
function okHtml() {
  var it = OKITEM, u, st, h, on, counted = okIsLeaf(it);
  okUnits();
  u = it._u;
  h = '<table class="okst" cellspacing="0" cellpadding="0">';
  if (counted) {
    on = okIsDone(it);
    h += '<tr><td colspan="2"><a href="#" class="okck' + (on ? ' on' : '') + '" onclick="return okToggle();"><span class="cb"></span>Okudum</a></td></tr>';
  }
  if (u) {
    st = okStat(u.leaves);
    h += '<tr><td class="okb">' + okBar(st) + '</td><td class="okr">' + esc(u.t) + ': ' + okLabel(st) + '</td></tr>';
  }
  return h + '</table>';
}
function okToggle() {
  var o = okLoad(), id = okId(OKITEM), box = document.getElementById('okbox');
  if (o[id]) { delete o[id]; } else { o[id] = 1; }
  okSave();
  if (box) { box.innerHTML = okHtml(); }
  return false;
}
function okMount(item) {
  var d = document.getElementsByTagName('div'), i, w = null, b;
  for (i = 0; i < d.length; i++) { if (hasClass(d[i], 'cw')) { w = d[i]; break; } }
  if (!w) { return; }
  OKITEM = item;
  b = document.createElement('div');
  b.className = 'xst okst';
  b.id = 'okbox';
  b.innerHTML = okHtml();
  w.appendChild(b);
}

/* ana sayfa: ilerleme tablosu (okunan konusu olan her ders/kitap; satir siniri yok) */
function okHomeWin() {
  var U, i, u, st, h = '', tot = 0, dn = 0, rows = 0, ps;
  try { U = okUnits(); } catch (e) { return ''; }
  for (i = 0; i < U.length; i++) {
    u = U[i]; st = okStat(U[i].leaves);
    tot += st.t; dn += st.d;
    if (st.d) {
      rows++;
      h += '<tr><td>' + esc(u.t) + ' <small>(' + esc(u.ctx) + ')</small></td><td class="pgb">' + okBar(st) + '</td><td class="pgp">%' + okPct(st) + '</td></tr>';
    }
  }
  ps = { d: dn, t: tot };
  if (rows) {
    h += '<tr class="pgtot"><td>Genel (' + dn + '/' + tot + ')</td><td class="pgb">' + okBar(ps) + '</td><td class="pgp">%' + okPct(ps) + '</td></tr>';
  } else {
    h = '<tr><td colspan="3">Hen&uuml;z okundu i&#351;aretlenen konu yok. Bir konu sayfas&#305;n&#305;n alt&#305;ndaki <b>Okudum</b> kutusunu i&#351;aretle.</td></tr>';
  }
  return '<div class="xw xact" id="win-prog">' + titleBar('doc.gif', '&#304;lerleme Durumu', minBtn()) +
    '<div class="xbd xbl"><table class="pgt" cellspacing="0" cellpadding="0"><tr><th>Ders / Kitap</th><th>&#304;lerleme</th><th>%</th></tr>' + h + '</table></div>' +
    '<div class="xst">' + rows + ' ders/kitap</div></div>';
}
/* ana sayfa: ayri "Kitapligim" penceresi (fiziksel kitaplar; ilerleme tablosundan bagimsiz) */
function ktHomeWin() {
  var bk = [], i, b, bs, h = '';
  try { bk = ktLoad(); } catch (e) { bk = []; }
  if (!bk.length) { return ''; }
  for (i = 0; i < bk.length; i++) {
    b = bk[i]; bs = { d: b.c, t: b.t };
    h += '<tr><td>' + esc(b.n) + ' <small>(' + b.c + '/' + b.t + ' sayfa)</small></td><td class="pgb">' + okBar(bs) + '</td><td class="pgp">%' + okPct(bs) + '</td></tr>';
  }
  return '<div class="xw xact" id="win-kt">' + titleBar('doc.gif', 'Kitapl&#305;&#287;&#305;m', minBtn()) +
    '<div class="xbd xbl"><table class="pgt" cellspacing="0" cellpadding="0"><tr><th>Kitap</th><th>&#304;lerleme</th><th>%</th></tr>' + h + '</table></div>' +
    '<div class="xst"><a href="' + MENU_ROOT + 'kitaplik.html">' + bk.length + ' kitap &middot; d&uuml;zenle</a></div></div>';
}

/* ---- kitaplik: fiziksel kitaplar (ad, toplam sayfa, kalinan sayfa, konum, not) ----
   Kayit dizgisi: kayitlar ';' ile, alanlar '|' ile ayrilir; alanlar encodeURIComponent'li. 1200 karakterlik parcalar halinde saklanir. */
function ktDec(x) { try { return decodeURIComponent(x); } catch (e) { return x; } }
function ktParse(s) {
  var out = [], recs, i, f, t, c;
  if (!s) { return out; }
  recs = s.split(';');
  for (i = 0; i < recs.length; i++) {
    f = recs[i].split('|');
    if (f.length < 5) { continue; }
    t = parseInt(f[1], 10); c = parseInt(f[2], 10);
    if (isNaN(t) || t < 1 || t > 100000) { continue; }
    if (isNaN(c) || c < 0) { c = 0; }
    if (c > t) { c = t; }
    out.push({ n: ktDec(f[0]).substring(0, 80), t: t, c: c, l: ktDec(f[3]).substring(0, 80), o: ktDec(f[4]).substring(0, 200) });
  }
  return out;
}
function ktStr(a) {
  var r = [], i, b;
  for (i = 0; i < a.length; i++) {
    b = a[i];
    r.push(encodeURIComponent(b.n) + '|' + b.t + '|' + b.c + '|' + encodeURIComponent(b.l) + '|' + encodeURIComponent(b.o));
  }
  return r.join(';');
}
function ktLoad() {
  var n = parseInt(sget('ktn'), 10) || 0, s = '', i;
  for (i = 0; i < n; i++) { s += sget('kt' + i); }
  return ktParse(s);
}
function ktSave(a) {
  var s = ktStr(a), n = Math.ceil(s.length / 1200), old = parseInt(sget('ktn'), 10) || 0, i;
  for (i = 0; i < n; i++) { sset('kt' + i, s.substring(i * 1200, (i + 1) * 1200)); }
  for (i = n; i < old; i++) { sset('kt' + i, ''); }
  sset('ktn', n);
}
