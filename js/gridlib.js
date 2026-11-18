/* Ortak izgara yardimcisi (ES3, BlackBerry OS 5 / Symbian uyumlu). Canvas yok: her hucre bir <img>,
   yalniz degisen hucrelerin src'si degistirilir (satrancta oldugu gibi, eski tarayicida guvenilir). */
function GridMake(hostId, w, h, s) {
  var host = document.getElementById(hostId), html = [], x, y, imgs, cur = [], i, g;
  html.push('<table class="gg" cellspacing="0" cellpadding="0"><tbody>');
  for (y = 0; y < h; y++) {
    html.push('<tr>');
    for (x = 0; x < w; x++) {
      html.push('<td><img src="img/g/g_e_' + s + '.gif" width="' + s + '" height="' + s + '" alt=""></td>');
    }
    html.push('</tr>');
  }
  html.push('</tbody></table>');
  host.innerHTML = html.join('');
  imgs = host.getElementsByTagName('img');
  for (i = 0; i < w * h; i++) { cur[i] = 'e'; }
  g = {
    w: w, h: h, s: s,
    set: function (idx, key) {
      if (cur[idx] !== key) { cur[idx] = key; imgs[idx].src = 'img/g/g_' + key + '_' + s + '.gif'; }
    },
    get: function (idx) { return cur[idx]; },
    clear: function () { var j; for (j = 0; j < cur.length; j++) { g.set(j, 'e'); } },
    /* hepsini zorla yeniden yaz (eski tarayici bir hucreyi yutarsa) */
    force: function () { var j; for (j = 0; j < cur.length; j++) { imgs[j].src = 'img/g/g_' + cur[j] + '_' + s + '.gif'; } }
  };
  return g;
}

/* klavye. fn(kod) dogru donerse tarayicinin kendi islemi (kaydirma) engellenir.
   BlackBerry'de bazi surumler yalniz keypress gonderir: keydown hic gelmediyse keypress'i (harf kodu buyuk harfe cevrilerek) kullan. */
function GameKeys(fn) {
  var seen = false;
  function run(e, k) {
    if (fn(k)) {
      if (e.preventDefault) { e.preventDefault(); }
      try { e.returnValue = false; } catch (err) {}
      return false;
    }
    return true;
  }
  document.onkeydown = function (e) {
    e = e || window.event; seen = true;
    return run(e, e.keyCode || e.which);
  };
  document.onkeypress = function (e) {
    var k;
    e = e || window.event;
    if (seen) { return true; }
    k = e.charCode || e.keyCode || e.which;
    if (k >= 97 && k <= 122) { k -= 32; }
    return run(e, k);
  };
}

/* orta iz topu tusu = tiklama. Baglanti/dugme uzerindeki tiklama dokunulmaz (kendi islevini yapar);
   oyun calisirken baska her yere (bosluk, izgara...) tiklamak fn() calistirir. */
function GameClick(isOn, fn) {
  document.onclick = function (e) {
    var t, n;
    e = e || window.event;
    t = e.target || e.srcElement;
    while (t && t.nodeType) {
      if (t.nodeType === 1) {
        n = t.tagName;
        if (n === 'A' || n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' || n === 'BUTTON') { return true; }
      }
      t = t.parentNode;
    }
    if (!isOn()) { return true; }
    fn();
    if (e.preventDefault) { e.preventDefault(); }
    return false;
  };
}
/* imleci (odagi) oyun alanindaki buyuk baglantiya tasi: iz topuna basinca hep oyun tepki versin */
function PadFocus(id) {
  try { var el = document.getElementById(id); if (el && el.focus) { el.focus(); } } catch (e) {}
}

/* ekran boyutuna gore varsayilan karo boyutu: kucuk ekranda dar, digerlerinde genis */
function TileDefault(smallS, bigS) {
  var w = 9999;
  try { w = screen.width || 9999; } catch (e) {}
  return w <= 340 ? smallS : bigS;
}
