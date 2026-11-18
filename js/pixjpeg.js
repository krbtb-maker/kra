/* Canvas'siz, saf ES3 baseline JPEG kodlayici (BlackBerry OS 5 / Symbian uyumlu).
   PixJpeg.encode(cells, n, scale, pal) -> base64 dizgesi. cells: n*n palet indeksi, pal: [[r,g,b],...].
   Cikti (n*scale) x (n*scale) piksel, 4:4:4, kalite 100 (nicemleme tablosu 1). scale 8'in kati ise her piksel tam
   bir 8x8 duz blok olur: yalniz DC kodlanir, hem cok hizli hem artefaktsiz. */
var PixJpeg = (function () {
  var ZZ = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
  var DCB = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
  var DCV = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var ACB = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
  var ACV = [0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
    0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
    0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
    0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa];
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var DCT = null, ACT = null, COS = null;

  function buildTable(bits, vals) {
    var code = 0, k = 0, i, j, t = [];
    for (i = 1; i <= 16; i++) {
      for (j = 0; j < bits[i - 1]; j++) { t[vals[k]] = [code, i]; code++; k++; }
      code = code << 1;
    }
    return t;
  }
  function init() {
    var u, x;
    if (DCT) { return; }
    DCT = buildTable(DCB, DCV); ACT = buildTable(ACB, ACV);
    COS = [];
    for (u = 0; u < 8; u++) {
      COS[u] = [];
      for (x = 0; x < 8; x++) { COS[u][x] = (u === 0 ? Math.SQRT1_2 : 1) * Math.cos((2 * x + 1) * u * Math.PI / 16) / 2; }
    }
  }

  function encode(cells, n, S, pal) {
    var out = [], buf = 0, cnt = 0, pred = [0, 0, 0];
    var W = n * S, H = n * S, bw = Math.ceil(W / 8), bh = Math.ceil(H / 8);
    var ycc = [], i, bx, by, k, ci, cx0, cx1, cy0, cy1, x0, y0, x1, y1, p, flat;
    var smp = [[], [], []], tmp = [], q = [];
    init();

    function putBits(code, len) {
      var b;
      for (b = len - 1; b >= 0; b--) {
        buf = (buf << 1) | ((code >> b) & 1); cnt++;
        if (cnt === 8) { out.push(buf); if (buf === 255) { out.push(0); } buf = 0; cnt = 0; }
      }
    }
    function cat(v) { var a = v < 0 ? -v : v, c = 0; while (a) { c++; a = a >> 1; } return c; }
    function put16(v) { out.push((v >> 8) & 255); out.push(v & 255); }
    function dcEnc(comp, v) {
      var d = v - pred[comp], c = cat(d), t = DCT[c];
      pred[comp] = v;
      putBits(t[0], t[1]);
      if (c) { putBits(d < 0 ? (d - 1) & ((1 << c) - 1) : d, c); }
    }
    function eob() { putBits(ACT[0][0], ACT[0][1]); }
    function acEnc() {
      var run = 0, z, v, c, t;
      for (z = 1; z < 64; z++) {
        v = q[ZZ[z]];
        if (v === 0) { run++; continue; }
        while (run > 15) { t = ACT[0xf0]; putBits(t[0], t[1]); run -= 16; }
        c = cat(v); t = ACT[(run << 4) | c];
        putBits(t[0], t[1]);
        putBits(v < 0 ? (v - 1) & ((1 << c) - 1) : v, c);
        run = 0;
      }
      if (run > 0) { eob(); }
    }
    function dct(src) {   /* src: 64 (satir*8+sutun), -128 kaydirilmis; q'ya yaz */
      var u, v, x, y, s;
      for (y = 0; y < 8; y++) {
        for (u = 0; u < 8; u++) {
          s = 0;
          for (x = 0; x < 8; x++) { s += COS[u][x] * src[y * 8 + x]; }
          tmp[y * 8 + u] = s;
        }
      }
      for (u = 0; u < 8; u++) {
        for (v = 0; v < 8; v++) {
          s = 0;
          for (y = 0; y < 8; y++) { s += COS[v][y] * tmp[y * 8 + u]; }
          q[v * 8 + u] = Math.round(s);
        }
      }
    }

    for (i = 0; i < pal.length; i++) {
      p = pal[i];
      ycc[i] = [
        0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2],
        -0.168736 * p[0] - 0.331264 * p[1] + 0.5 * p[2] + 128,
        0.5 * p[0] - 0.418688 * p[1] - 0.081312 * p[2] + 128
      ];
    }

    /* basliklar */
    out.push(0xff, 0xd8);
    out.push(0xff, 0xe0); put16(16); out.push(0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0); put16(1); put16(1); out.push(0, 0);
    out.push(0xff, 0xdb); put16(67); out.push(0); for (i = 0; i < 64; i++) { out.push(1); }
    out.push(0xff, 0xc0); put16(17); out.push(8); put16(H); put16(W); out.push(3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0);
    out.push(0xff, 0xc4); put16(2 + 17 + DCV.length + 17 + ACV.length);
    out.push(0x00); for (i = 0; i < 16; i++) { out.push(DCB[i]); } for (i = 0; i < DCV.length; i++) { out.push(DCV[i]); }
    out.push(0x10); for (i = 0; i < 16; i++) { out.push(ACB[i]); } for (i = 0; i < ACV.length; i++) { out.push(ACV[i]); }
    out.push(0xff, 0xda); put16(12); out.push(3, 1, 0, 2, 0, 3, 0, 0, 63, 0);

    for (by = 0; by < bh; by++) {
      y0 = by * 8; y1 = y0 + 7; if (y1 > H - 1) { y1 = H - 1; }
      cy0 = Math.floor(y0 / S); cy1 = Math.floor(y1 / S);
      for (bx = 0; bx < bw; bx++) {
        x0 = bx * 8; x1 = x0 + 7; if (x1 > W - 1) { x1 = W - 1; }
        cx0 = Math.floor(x0 / S); cx1 = Math.floor(x1 / S);
        flat = (cx0 === cx1 && cy0 === cy1);
        if (flat) {
          p = ycc[cells[cy0 * n + cx0]];
          for (ci = 0; ci < 3; ci++) { dcEnc(ci, Math.round(8 * (p[ci] - 128))); eob(); }
        } else {
          for (k = 0; k < 64; k++) {
            var px = x0 + (k & 7), py = y0 + (k >> 3), c2;
            if (px > W - 1) { px = W - 1; } if (py > H - 1) { py = H - 1; }
            c2 = ycc[cells[Math.floor(py / S) * n + Math.floor(px / S)]];
            smp[0][k] = c2[0] - 128; smp[1][k] = c2[1] - 128; smp[2][k] = c2[2] - 128;
          }
          for (ci = 0; ci < 3; ci++) { dct(smp[ci]); dcEnc(ci, q[0]); acEnc(); if (false) { eob(); } }
        }
      }
    }
    if (cnt > 0) { putBits((1 << (8 - cnt)) - 1, 8 - cnt); }
    out.push(0xff, 0xd9);

    /* base64 */
    var s = [], a, b, c, L = out.length;
    for (i = 0; i < L; i += 3) {
      a = out[i]; b = i + 1 < L ? out[i + 1] : 0; c = i + 2 < L ? out[i + 2] : 0;
      s.push(B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4)) + (i + 1 < L ? B64.charAt(((b & 15) << 2) | (c >> 6)) : '=') + (i + 2 < L ? B64.charAt(c & 63) : '='));
    }
    return { b64: s.join(''), bytes: L, w: W, h: H };
  }
  return { encode: encode };
})();
