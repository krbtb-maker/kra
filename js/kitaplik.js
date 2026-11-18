/* Kitapligim - fiziksel kitaplar (ES3, BlackBerry OS 5 / Symbian uyumlu).
   Depolama: theme.js'teki ktLoad/ktSave (cerez + localStorage + window.name). Okuma ilerlemesi cubugu: okBar/okPct. */
var Kt = (function () {
  var books = [], editing = -2;   /* -2: form kapali, -1: yeni, >=0: duzenle */
  function $(id) { return document.getElementById(id); }
  function setHtml(id, h) { var e = $(id); if (e) { e.innerHTML = h; } }
  function e(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
  function num(s) { var v = parseInt(trim(s), 10); return isNaN(v) ? NaN : v; }
  function val(id) { var x = $(id); return x ? x.value : ''; }
  function msg(t) { setHtml('ktmsg', t || '&nbsp;'); }

  function render() {
    var h = '', i, b, st, p;
    if (!books.length) { h = '<p>Hen&uuml;z kitap eklenmedi. <b>Kitap ekle</b> d&uuml;&#287;mesiyle ba&#351;la.</p>'; }
    for (i = 0; i < books.length; i++) {
      b = books[i]; st = { d: b.c, t: b.t }; p = okPct(st);
      h += '<div class="ktc"><b class="ktn">' + e(b.n) + '</b>' +
        '<table class="okst" cellspacing="0" cellpadding="0"><tr><td class="okb">' + okBar(st) + '</td><td class="okr">%' + p + ' &middot; ' + b.c + '/' + b.t + ' sayfa' + (b.c >= b.t ? ' &ndash; bitti' : '') + '</td></tr></table>' +
        (b.l ? '<div class="ktm"><b>Nerede:</b> ' + e(b.l) + '</div>' : '') +
        (b.o ? '<div class="ktm"><b>Not:</b> ' + e(b.o) + '</div>' : '') +
        '<div class="ktm">Kald&#305;&#287;&#305;m sayfa: <input type="text" class="ktp" id="kp' + i + '" size="4" maxlength="6" value="' + b.c + '"> ' +
        '<a class="solbtn" href="#" onclick="return Kt.upd(' + i + ')">G&uuml;ncelle</a></div>' +
        '<div class="gbtns"><a class="solbtn" href="#" onclick="return Kt.edit(' + i + ')">D&uuml;zenle</a> <a class="solbtn" href="#" onclick="return Kt.del(' + i + ')">Sil</a></div></div>';
    }
    setHtml('ktlist', h);
  }
  function form() {
    var b, h;
    if (editing === -2) { setHtml('ktform', ''); return; }
    b = editing >= 0 ? books[editing] : { n: '', t: '', c: 0, l: '', o: '' };
    h = '<div class="ktc ktf"><p><b>' + (editing >= 0 ? 'Kitab&#305; d&uuml;zenle' : 'Yeni kitap') + '</b></p>' +
      '<p>Kitab&#305;n ad&#305;:<br><input type="text" class="kti" id="fn" maxlength="80" value="' + e(b.n) + '"></p>' +
      '<p>Toplam sayfa:<br><input type="text" class="ktnum" id="ft" maxlength="6" value="' + (b.t || '') + '"></p>' +
      '<p>Kald&#305;&#287;&#305;m sayfa:<br><input type="text" class="ktnum" id="fc" maxlength="6" value="' + b.c + '"></p>' +
      '<p>Nerede (raf, ki&#351;i, kitapl&#305;k...):<br><input type="text" class="kti" id="fl" maxlength="80" value="' + e(b.l) + '"></p>' +
      '<p>Not:<br><input type="text" class="kti" id="fo" maxlength="200" value="' + e(b.o) + '"></p>' +
      '<div class="gbtns"><a class="solbtn" href="#" onclick="return Kt.save()"><b>Kaydet</b></a> <a class="solbtn" href="#" onclick="return Kt.cancel()">Vazge&ccedil;</a></div>' +
      '<div id="ftmsg" class="status" style="display:none">&nbsp;</div></div>';
    setHtml('ktform', h);
  }
  function persist() { ktSave(books); }
  function fail(t) { var m = $('ftmsg'); if (m) { m.style.display = 'block'; m.innerHTML = t; } return false; }

  function ok(s) { return ('' + s).replace(/\s+/g, ''); }
  function readMarks() { var o = okLoad(), k, s = ''; for (k in o) { if (o[k]) { s += k; } } return s; }
  function loadMarks(s, replace) {
    var o, i;
    if (replace) { OKS = {}; } else { okLoad(); }
    for (i = 0; i + 5 <= s.length; i += 5) { OKS[s.substring(i, i + 5)] = 1; }
    okSave();
  }

  return {
    init: function () {
      books = ktLoad();
      var nj = $('nojs'), k = $('kt');
      if (nj) { nj.style.display = 'none'; }
      if (k) { k.style.display = 'block'; }
      render(); form();
    },
    add: function () { editing = -1; form(); render(); return false; },
    edit: function (i) { editing = i; form(); return false; },
    cancel: function () { editing = -2; form(); return false; },
    save: function () {
      var n = trim(val('fn')), t = num(val('ft')), c = num(val('fc')), b;
      if (!n) { return fail('Kitab&#305;n ad&#305;n&#305; yaz.'); }
      if (isNaN(t) || t < 1 || t > 100000) { return fail('Toplam sayfa 1 ile 100000 aras&#305;nda bir say&#305; olmal&#305;.'); }
      if (isNaN(c)) { c = 0; }
      if (c < 0) { c = 0; }
      if (c > t) { c = t; }
      b = { n: n, t: t, c: c, l: trim(val('fl')), o: trim(val('fo')) };
      if (editing >= 0) { books[editing] = b; } else { books.push(b); }
      editing = -2; persist(); form(); render();
      return false;
    },
    upd: function (i) {
      var c = num(val('kp' + i)), b = books[i];
      if (isNaN(c) || c < 0) { c = 0; }
      if (c > b.t) { c = b.t; }
      b.c = c; persist(); render();
      return false;
    },
    del: function (i) {
      var ok2 = true;
      try { ok2 = confirm('"' + books[i].n + '" silinsin mi?'); } catch (e1) {}
      if (!ok2) { return false; }
      books.splice(i, 1); persist(); editing = -2; form(); render();
      return false;
    },
    xp: function () {
      var d = $('ktxp');
      if (d) { d.style.display = d.style.display === 'none' ? 'block' : 'none'; }
      return false;
    },
    exp: function () {
      var ta = $('ktta');
      if (!ta) { return false; }
      ta.value = 'IKRA1\nK:' + ktStr(books) + '\nO:' + readMarks();
      try { ta.focus(); ta.select(); } catch (e2) {}
      msg('Metin haz&#305;r: se&ccedil;ip kopyala ve sakla.');
      return false;
    },
    imp: function (replace) {
      var s = ok(val('ktta')), ki, oi, bs, os, list, ois;
      if (s.indexOf('IKRA1') !== 0) { msg('Ge&ccedil;ersiz metin: &ldquo;IKRA1&rdquo; ile ba&#351;lamal&#305;. Mevcut kay&#305;tlar de&#287;i&#351;medi.'); return false; }
      ki = s.indexOf('K:'); oi = s.indexOf('O:');
      if (ki < 0 || oi < ki) { msg('Metin eksik ya da bozuk. Mevcut kay&#305;tlar de&#287;i&#351;medi.'); return false; }
      bs = s.substring(ki + 2, oi); os = s.substring(oi + 2);
      if (os.length % 5 !== 0 || /[^0-9a-z]/.test(os)) { msg('&ldquo;Okudum&rdquo; b&ouml;l&uuml;m&uuml; bozuk. Mevcut kay&#305;tlar de&#287;i&#351;medi.'); return false; }
      list = ktParse(bs);
      if (bs && !list.length) { msg('Kitap listesi okunamad&#305;. Mevcut kay&#305;tlar de&#287;i&#351;medi.'); return false; }
      books = replace ? list : books.concat(list);
      persist(); loadMarks(os, !!replace);
      editing = -2; form(); render();
      msg(list.length + ' kitap ' + (replace ? 'aktar&#305;ld&#305; (liste de&#287;i&#351;tirildi)' : 'eklendi') + '; ' + (os.length / 5) + ' &ldquo;Okudum&rdquo; i&#351;areti.');
      return false;
    }
  };
})();
Kt.init();
