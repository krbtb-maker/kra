/* Bilardo - ES3 (BlackBerry OS 5 / Symbian uyumlu). Canvas yok: toplar, ceplar ve nisan noktalari <img>.
   Mantiksal alan 300 x 150 birim; ekrana olcekle (SC) cizilir. Tum toplari deliklere sok, en az vurusla.
   Cizim modlari (eski tarayicilarda stil degisikligi bazen ekrana yansimaz, toplar "kaybolur"):
     rm=0 GUVENLI: her karede top katmani innerHTML ile yeniden yazilir (varsayilan)
     rm=1 HIZLI  : toplar yerinde tasinir (tek cssText atamasi, yalniz degisenler, periyodik tam yenileme) */
(function () {
  var FW = 300, FH = 150, R = 5, PR = 11;
  var SC = [0.7, 0.82, 1.0, 1.4], BD = [7, 8, 10, 14], PD = [15, 18, 22, 31];
  var SN = ['\u00c7ok k\u00fc\u00e7\u00fck', 'K\u00fc\u00e7\u00fck', 'Orta', 'B\u00fcy\u00fck'];
  var PV = [4, 7, 10, 14], PN = ['Zay\u0131f', 'Orta', 'G\u00fc\u00e7l\u00fc', 'Tam'], ND = [3, 6, 9, 12];
  var CM = [0, 1, 2, 3, 4, 8, 5, 6, 7, 9];   /* top no -> renk dosyasi (8 = siyah, rakin ortasinda) */
  var FR = 0.96, MINV = 0.2, WR = 0.82, REST = 0.95, SUB = 3, MS = 40;
  var HX = 75, HY = FH / 2;                   /* beyaz top baslangic noktasi */
  var POCK = [[0, 0], [FW / 2, 0], [FW, 0], [0, FH], [FW / 2, FH], [FW, FH]];
  var balls = [], dots = [], ly = null, rm = 0, fc = 0, angle = 0, pw = 1, si = 1, shots = 0, scr = 0;
  var moving = false, over = false, scratch = false, gen = 0, ready = false;

  function $(id) { return document.getElementById(id); }
  function setHtml(id, h) { var e = $(id); if (e) { e.innerHTML = h; } }

  /* varsayilan masa boyutu: ekran genisligine gore; secim hatirlanir */
  (function () {
    var w = 9999, v;
    try { w = screen.width || 9999; } catch (e) {}
    si = w <= 340 ? 1 : (w <= 480 ? 2 : 3);
    v = parseInt(sget('bilsz'), 10);
    if (v >= 0 && v < SC.length) { si = v; }
    v = parseInt(sget('bilrm'), 10);
    if (v === 1) { rm = 1; }
  })();

  function mkImg(src, w, h) {
    var im = document.createElement('img');
    im.src = src; im.width = w; im.height = h; im.alt = '';
    return im;
  }
  /* hizli mod: topu yerine tasi (tek atama; konum degismediyse dokunma) */
  function place(b, force) {
    var s = SC[si], x = Math.round((b.x - R) * s), y = Math.round((b.y - R) * s);
    if (!b.el) { return; }
    if (!force && x === b.px && y === b.py) { return; }
    b.px = x; b.py = y;
    b.el.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;visibility:visible';
  }
  function hideBall(b) {
    if (b.el) { b.el.style.cssText = 'position:absolute;left:-40px;top:-40px;visibility:hidden'; }
    b.px = -999; b.py = -999;
  }

  /* guvenli mod: top + nisan katmanini tek seferde yeniden yaz */
  function aimPts() {
    var out = [], k, x, y, rad = angle * Math.PI / 180, c = Math.cos(rad), sn = Math.sin(rad), cue = balls[0], n = ND[pw];
    if (moving || over || !cue || !cue.on) { return out; }
    for (k = 0; k < n; k++) {
      x = cue.x + c * (R + 6 + k * 11); y = cue.y + sn * (R + 6 + k * 11);
      if (x > 2 && x < FW - 2 && y > 2 && y < FH - 2) { out.push([x, y]); }
    }
    return out;
  }
  function render() {
    var s = SC[si], d = BD[si], h = [], i, b, pts, p;
    if (!ly) { return; }
    pts = aimPts();
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      h.push('<img src="img/pool/dot3.gif" width="3" height="3" alt="" style="position:absolute;left:' + Math.round(p[0] * s - 1) + 'px;top:' + Math.round(p[1] * s - 1) + 'px">');
    }
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (!b.on) { continue; }
      h.push('<img src="img/pool/b' + CM[i] + '_' + d + '.gif" width="' + d + '" height="' + d + '" alt="" style="position:absolute;left:' + Math.round((b.x - R) * s) + 'px;top:' + Math.round((b.y - R) * s) + 'px">');
    }
    ly.innerHTML = h.join('');
  }
  function draw(force) {
    var i, b;
    if (rm === 0) { render(); return; }
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (b.on) { place(b, force); }
    }
  }

  /* masayi (ceplar, nisan noktalari, toplar) sifirdan kur */
  function layout() {
    var t = $('tbl'), s = SC[si], d = BD[si], pd = PD[si], i, k, im, b;
    t.style.width = Math.round(FW * s) + 'px';
    t.style.height = Math.round(FH * s) + 'px';
    while (t.firstChild) { t.removeChild(t.firstChild); }
    for (i = 0; i < POCK.length; i++) {
      im = mkImg('img/pool/pk_' + pd + '.gif', pd, pd);
      im.style.left = Math.round(POCK[i][0] * s - pd / 2) + 'px';
      im.style.top = Math.round(POCK[i][1] * s - pd / 2) + 'px';
      t.appendChild(im);
    }
    ly = document.createElement('div');
    ly.style.cssText = 'position:absolute;left:0px;top:0px;width:' + Math.round(FW * s) + 'px;height:' + Math.round(FH * s) + 'px';
    t.appendChild(ly);
    dots = [];
    if (rm === 1) {
      for (k = 0; k < 12; k++) {
        im = mkImg('img/pool/dot3.gif', 3, 3);
        im.style.cssText = 'position:absolute;left:0px;top:0px;visibility:hidden';
        ly.appendChild(im); dots.push(im);
      }
      for (i = 0; i < balls.length; i++) {
        b = balls[i];
        b.el = mkImg('img/pool/b' + CM[i] + '_' + d + '.gif', d, d);
        b.px = -999; b.py = -999;
        hideBall(b);
        ly.appendChild(b.el);
      }
    }
    draw(true);
  }

  function rack() {
    var x0 = 205, dx = 2 * R * 0.87 + 0.6, dy = 2 * R + 0.6, rows = [1, 2, 3, 2, 1], idx = 1, r, k, b;
    for (r = 0; r < 5; r++) {
      for (k = 0; k < rows[r]; k++) {
        b = balls[idx++];
        b.x = x0 + r * dx; b.y = FH / 2 + (k - (rows[r] - 1) / 2) * dy;
      }
    }
  }

  function remaining() {
    var i, n = 0;
    for (i = 1; i < balls.length; i++) { if (balls[i].on) { n++; } }
    return n;
  }

  function showStatus(extra) {
    var b = sget('bilbest'), h;
    h = 'Vuru\u015f: <b>' + shots + '</b> &nbsp; Kalan top: <b>' + remaining() + '</b>';
    if (scr > 0) { h += ' &nbsp; Ceza: <b>+' + (scr * 2) + '</b>'; }
    if (b !== '') { h += ' &nbsp; En iyi: <b>' + b + '</b>'; }
    if (extra) { h += '<br>' + extra; }
    setHtml('status', h);
  }

  function drawAim() {
    var s = SC[si], pts, k, el;
    if (rm === 0) { render(); return; }
    pts = aimPts();
    for (k = 0; k < dots.length; k++) {
      el = dots[k];
      if (k < pts.length) {
        el.style.cssText = 'position:absolute;left:' + Math.round(pts[k][0] * s - 1) + 'px;top:' + Math.round(pts[k][1] * s - 1) + 'px;visibility:visible';
      } else { el.style.cssText = 'position:absolute;left:0px;top:0px;visibility:hidden'; }
    }
  }

  function labels() {
    setHtml('pw', PN[pw]);
    setHtml('psz', SN[si]);
    setHtml('prm', rm === 0 ? 'G\u00fcvenli' : 'H\u0131zl\u0131');
  }

  function newGame() {
    var i, b;
    gen++;
    if (balls.length === 0) {
      for (i = 0; i < 10; i++) { balls.push({ x: 0, y: 0, vx: 0, vy: 0, on: true, el: null, px: -999, py: -999 }); }
    }
    for (i = 0; i < 10; i++) { b = balls[i]; b.on = true; b.vx = 0; b.vy = 0; }
    balls[0].x = HX; balls[0].y = HY;
    rack();
    shots = 0; scr = 0; moving = false; over = false; scratch = false; angle = 0;
    layout(); labels(); drawAim();
    showStatus('A\u00e7\u0131y\u0131 ayarla, g\u00fcc\u00fc se\u00e7, <b>VUR</b>.');
    return false;
  }

  function aim(dd) {
    if (moving || over) { return false; }
    angle = (angle + dd) % 360; if (angle < 0) { angle += 360; }
    drawAim();
    return false;
  }
  function power() {
    if (moving) { return false; }
    pw = (pw + 1) % PV.length; labels(); drawAim();
    return false;
  }
  function size() {
    if (moving) { return false; }
    si = (si + 1) % SC.length; sset('bilsz', si);
    layout(); labels(); drawAim();
    return false;
  }

  function rmode() {
    if (moving) { return false; }
    rm = rm === 0 ? 1 : 0; sset('bilrm', rm);
    layout(); labels(); drawAim();
    return false;
  }

  /* masaya dokununca / tiklayinca o noktaya nisan al */
  function evPos(e) {
    var d = document.documentElement, b = document.body;
    e = e || window.event;
    if (e.pageX !== undefined && e.pageX !== null) { return [e.pageX, e.pageY]; }
    return [e.clientX + (d.scrollLeft || b.scrollLeft || 0), e.clientY + (d.scrollTop || b.scrollTop || 0)];
  }
  function elPos(el) {
    var x = 0, y = 0;
    while (el) { x += el.offsetLeft || 0; y += el.offsetTop || 0; el = el.offsetParent; }
    return [x, y];
  }
  function onTable(e) {
    var t = $('tbl'), p, o, s = SC[si], fx, fy, cue = balls[0];
    if (moving || over || !cue.on) { return true; }
    try {
      p = evPos(e); o = elPos(t);
      fx = (p[0] - o[0] - (t.clientLeft || 0)) / s - cue.x;
      fy = (p[1] - o[1] - (t.clientTop || 0)) / s - cue.y;
      if (fx * fx + fy * fy < 16) { return false; }
      angle = Math.atan2(fy, fx) * 180 / Math.PI; if (angle < 0) { angle += 360; }
      drawAim();
    } catch (err) {}
    return false;
  }

  function pocketed(b) {
    var i, dx, dy;
    for (i = 0; i < POCK.length; i++) {
      dx = b.x - POCK[i][0]; dy = b.y - POCK[i][1];
      if (dx * dx + dy * dy < PR * PR) { return true; }
    }
    return false;
  }

  function frame() {
    var k, i, j, a, b, dx, dy, d, nx, ny, ov, dv, imp, any = false, sp;
    for (k = 0; k < SUB; k++) {
      for (i = 0; i < balls.length; i++) {
        b = balls[i];
        if (!b.on) { continue; }
        b.x += b.vx / SUB; b.y += b.vy / SUB;
        if (pocketed(b)) {
          b.on = false; b.vx = 0; b.vy = 0; hideBall(b);
          if (i === 0) { scratch = true; }
          continue;
        }
        if (b.x !== b.x || b.y !== b.y) { b.x = FW / 2; b.y = FH / 2; b.vx = 0; b.vy = 0; }
        if (b.x < R) { b.x = R; b.vx = -b.vx * WR; }
        else if (b.x > FW - R) { b.x = FW - R; b.vx = -b.vx * WR; }
        if (b.y < R) { b.y = R; b.vy = -b.vy * WR; }
        else if (b.y > FH - R) { b.y = FH - R; b.vy = -b.vy * WR; }
      }
      for (i = 0; i < balls.length; i++) {
        a = balls[i];
        if (!a.on) { continue; }
        for (j = i + 1; j < balls.length; j++) {
          b = balls[j];
          if (!b.on) { continue; }
          dx = b.x - a.x; dy = b.y - a.y; d = dx * dx + dy * dy;
          if (d <= 0.0001) { b.x += 0.5; b.y += 0.3; continue; }
          if (d < 4 * R * R) {
            d = Math.sqrt(d); nx = dx / d; ny = dy / d;
            ov = (2 * R - d) / 2;
            a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
            dv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (dv > 0) {
              imp = dv * (1 + REST) / 2;
              a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
            }
          }
        }
      }
    }
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (!b.on) { continue; }
      b.vx *= FR; b.vy *= FR;
      sp = b.vx * b.vx + b.vy * b.vy;
      if (sp < MINV * MINV) { b.vx = 0; b.vy = 0; } else { any = true; }
    }
    return any;
  }

  function loop(g) {
    var more = false;
    if (g !== gen) { return; }
    try { more = frame(); fc++; draw(fc % 6 === 0); } catch (err) { more = false; }
    if (more) { setTimeout(function () { loop(g); }, MS); }
    else { endShot(); }
  }

  function isFree(x, y) {
    var i, dx, dy;
    for (i = 1; i < balls.length; i++) {
      if (!balls[i].on) { continue; }
      dx = balls[i].x - x; dy = balls[i].y - y;
      if (dx * dx + dy * dy < (2 * R + 1) * (2 * R + 1)) { return false; }
    }
    return true;
  }
  function respot() {
    var c = balls[0], dx, dy, offs = [0, -40, 40], j, x, y, done = false;
    for (j = 0; j < offs.length && !done; j++) {
      for (dx = 0; dx <= 65 && !done; dx += 5) {
        y = HY + offs[j];
        if (isFree(HX - dx, y)) { c.x = HX - dx; c.y = y; done = true; }
        else if (isFree(HX + dx, y)) { c.x = HX + dx; c.y = y; done = true; }
      }
    }
    if (!done) { c.x = HX; c.y = HY; }
    c.vx = 0; c.vy = 0; c.on = true;
    c.px = -999; c.py = -999;
  }

  function endShot() {
    var msg = '', total, best;
    moving = false;
    if (scratch) { scr++; respot(); msg = '<b>Faul!</b> Beyaz top delikten d\u00fc\u015ft\u00fc (+2 ceza).'; scratch = false; }
    if (remaining() === 0) {
      over = true; total = shots + scr * 2;
      best = parseInt(sget('bilbest'), 10);
      if (isNaN(best) || total < best) { sset('bilbest', total); msg = '<b>Tebrikler!</b> Yeni en iyi: ' + total + ' puan.'; }
      else { msg = '<b>Bitti!</b> Puan\u0131n: ' + total + ' (vuru\u015f + ceza).'; }
    }
    showStatus(msg);
    draw(true);
    drawAim();
  }

  function shoot() {
    var cue = balls[0], rad = angle * Math.PI / 180;
    if (moving || over || !cue.on) { return false; }
    cue.vx = Math.cos(rad) * PV[pw]; cue.vy = Math.sin(rad) * PV[pw];
    shots++; moving = true; scratch = false;
    drawAim(); showStatus('Toplar yuvarlan\u0131yor...');
    var g = gen;
    setTimeout(function () { loop(g); }, MS);
    return false;
  }

  function init() {
    $('tbl').onclick = onTable;
    newGame();
    $('game').style.display = 'block';
    var nj = $('nojs'); if (nj) { nj.style.display = 'none'; }
    ready = true;
  }

  window.Pool = { aim: aim, power: power, shoot: shoot, newGame: newGame, size: size, rmode: rmode };
  if (window.addEventListener) { window.addEventListener('load', init, false); }
  else { window.onload = init; }
})();
