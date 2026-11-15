/* ikra forum - BlackBerry OS 5 / Symbian uyumlu (ES3). Ortak yardimcilar, kayit, tema, menu gorunurlugu.
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
