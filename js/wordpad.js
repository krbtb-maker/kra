/* WordPad - metin yazici (ES3, BlackBerry OS 5 / Symbian uyumlu). Duz metin; .txt olarak kaydet.
   Kayit: localStorage + window.name (cerez degil; uzun metin cerez sinirini asar). Kaydet = data: baglantisi + kopyalama. */
(function () {
  var FONTS = [['Courier New', '"Courier New",Courier,monospace'], ['Arial', 'Arial,Helvetica,sans-serif'],
               ['Times New Roman', '"Times New Roman",Times,serif'], ['Tahoma', 'Tahoma,Verdana,sans-serif']];
  var SIZES = [12, 14, 16, 20, 24];
  var fi = 0, si = 2, wrap = true, bom = true, saveT = null, ta = null;

  function $(id) { return document.getElementById(id); }
  function setHtml(id, h) { var e = $(id); if (e) { e.innerHTML = h; } }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ---- kayit ---- */
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
  function saveNow() { saveT = null; pset('wpt', ta.value); pset('wpn', nameVal()); }
  function saveSoon() { if (saveT !== null) { clearTimeout(saveT); } saveT = setTimeout(saveNow, 1200); }

  /* ---- dosya adi ---- */
  function cleanName(s) {
    s = String(s || '').replace(/[\\\/:*?"<>|]/g, '').replace(/^\s+|\s+$/g, '').replace(/\.txt$/i, '');
    return s === '' ? 'belge' : s;
  }
  function nameVal() { var e = $('wname'); return cleanName(e ? e.value : ''); }

  /* ---- gorunum ---- */
  function applyStyle() {
    ta.style.fontFamily = FONTS[fi][1];
    ta.style.fontSize = SIZES[si] + 'px';
    try { ta.setAttribute('wrap', wrap ? 'soft' : 'off'); } catch (e) {}
    ta.style.whiteSpace = wrap ? 'normal' : 'pre';
    setHtml('wfn', FONTS[fi][0]); setHtml('wsz', String(SIZES[si]));
    setHtml('wwr', wrap ? 'Açık' : 'Kapalı'); setHtml('wbm', bom ? 'Var' : 'Yok');
  }
  function update() {
    var v = ta.value, w = v.match(/\S+/g), l = (v === '') ? 0 : v.split(/\r\n|\r|\n/).length;
    setHtml('wst', 'Karakter: <b>' + v.length + '</b> &nbsp; Kelime: <b>' + (w ? w.length : 0) + '</b> &nbsp; Satır: <b>' + l + '</b>');
    saveSoon();
  }
  function msg(h) { setHtml('wmsg', h); }

  /* ---- islemler ---- */
  function insert(s) {
    var a, b, v, pos, r;
    if (typeof ta.selectionStart === 'number') {
      a = ta.selectionStart; b = ta.selectionEnd; v = ta.value;
      ta.value = v.substring(0, a) + s + v.substring(b);
      pos = a + s.length;
      try { ta.selectionStart = pos; ta.selectionEnd = pos; } catch (e) {}
    } else if (document.selection && document.selection.createRange) {
      ta.focus(); r = document.selection.createRange(); r.text = s;
    } else { ta.value = ta.value + s; }
    update();
  }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function stamp() {
    var d = new Date();
    insert(p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()));
    try { ta.focus(); } catch (e) {}
    return false;
  }
  function fresh() {
    if (ta.value !== '' && !window.confirm('Belge temizlensin mi? Kaydedilmemiş yazı silinir.')) { return false; }
    ta.value = ''; var e = $('wname'); if (e) { e.value = 'belge'; }
    setHtml('wout', ''); msg(''); update(); saveNow();
    try { ta.focus(); } catch (e2) {}
    return false;
  }
  function sel() {
    try { ta.focus(); ta.select(); if (ta.setSelectionRange) { ta.setSelectionRange(0, ta.value.length); } } catch (e) {}
    return false;
  }
  function copy() {
    var ok = false;
    sel();
    try { ok = document.execCommand('copy'); } catch (e) {}
    msg(ok ? '<div class="status">Kopyalandı.</div>' :
      '<div class="note">Metin seçildi. Telefonda menü tuşu / uzun bas &rarr; <i>Kopyala</i> de.</div>');
    return false;
  }
  function save() {
    var t = ta.value.replace(/\r\n|\r|\n/g, '\r\n'), fname = nameVal() + '.txt', uri, kb, link;
    if (bom) { t = '\uFEFF' + t; }
    kb = Math.round(t.length / 102.4) / 10;
    saveNow();
    if (t.length > 400000) {
      setHtml('wout', '<div class="note"><b>Metin çok uzun</b> (' + kb + ' KB): indirme bağlantısı oluşturulamadı. <b>Seç</b> ile kopyalayıp bir not uygulamasına yapıştır.</div>');
      return false;
    }
    uri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(t);
    link = '<a class="solbtn" href="' + uri + '" download="' + esc(fname) + '">&#9660; Kaydet: ' + esc(fname) + '</a>';
    setHtml('wout', '<div class="status">Dosya hazır: <b>' + esc(fname) + '</b>, ' + kb + ' KB</div>' +
      '<div class="gbtns">' + link + '</div>' +
      '<div class="note">Bilgisayarda yukarıdaki düğme dosyayı indirir. Telefonda indirme çalışmazsa <b>Seç</b> &rarr; <i>Kopyala</i> yapıp bir not uygulamasına yapıştır.</div>');
    return false;
  }
  function openFile() {
    var inp = $('wfile'), f, r, nm;
    if (!inp || !inp.files || !inp.files[0]) { return; }
    f = inp.files[0];
    if (f.size && f.size > 2000000) { msg('<div class="note">Dosya çok büyük (en çok 2 MB).</div>'); return; }
    if (ta.value !== '' && !window.confirm('Açılan dosya mevcut yazının yerine geçsin mi?')) { return; }
    r = new FileReader();
    r.onload = function () {
      var s = String(r.result || '');
      if (s.charAt(0) === '\uFEFF') { s = s.substring(1); }
      ta.value = s; nm = $('wname'); if (nm) { nm.value = cleanName(f.name); }
      update(); saveNow(); msg('<div class="status">Dosya açıldı: ' + esc(f.name) + '</div>');
    };
    r.onerror = function () { msg('<div class="note">Dosya okunamadı.</div>'); };
    try { r.readAsText(f, 'UTF-8'); } catch (e) { r.readAsText(f); }
  }

  function font() { fi = (fi + 1) % FONTS.length; sset('wpf', fi); applyStyle(); return false; }
  function size() { si = (si + 1) % SIZES.length; sset('wps', si); applyStyle(); return false; }
  function wrapT() { wrap = !wrap; sset('wpw', wrap ? 1 : 0); applyStyle(); return false; }
  function bomT() { bom = !bom; sset('wpb', bom ? 1 : 0); applyStyle(); return false; }

  function init() {
    var z, t, nm, nj, op;
    ta = $('wtxt'); if (!ta) { return; }
    z = parseInt(sget('wpf'), 10); if (z >= 0 && z < FONTS.length) { fi = z; }
    z = parseInt(sget('wps'), 10); if (z >= 0 && z < SIZES.length) { si = z; }
    z = sget('wpw'); if (z !== '') { wrap = (z === '1'); }
    z = sget('wpb'); if (z !== '') { bom = (z === '1'); }
    t = pget('wpt'); if (t) { ta.value = t; }
    nm = pget('wpn'); if (nm && $('wname')) { $('wname').value = cleanName(nm); }
    ta.onkeyup = update; ta.onchange = update; ta.oninput = update; ta.onblur = update;
    if ($('wname')) { $('wname').onchange = saveSoon; }
    if (window.FileReader && $('wfile') && $('wfile').files !== undefined) {
      op = $('wopen'); if (op) { op.style.display = 'block'; } $('wfile').onchange = openFile;
    }
    applyStyle(); update();
    $('wp').style.display = 'block';
    nj = $('nojs'); if (nj) { nj.style.display = 'none'; }
  }
  window.Wp = { fresh: fresh, save: save, sel: sel, copy: copy, stamp: stamp, font: font, size: size, wrap: wrapT, bom: bomT };
  if (window.addEventListener) {
    window.addEventListener('load', init, false);
    window.addEventListener('unload', function () { if (saveT !== null && ta) { saveNow(); } }, false);
  } else { window.onload = init; }
})();
