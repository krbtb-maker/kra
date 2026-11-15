/* Satranc motoru - eski tarayicilar (BlackBerry OS 5, Symbian) icin duz ES3 JavaScript.
   let/const, =>, forEach, indexOf (dizide), JSON, Date.now YOK. Tek ornek (singleton).
   Tahta: 64 kare, kare = sira*8 + sutun (a1 = 0, h8 = 63). Beyaz taslar +, siyah taslar -.
   Tas: 1 piyon, 2 at, 3 fil, 4 kale, 5 vezir, 6 sah.
   Hamle (int): kaynak | hedef<<6 | terfi<<12 */
var ChessEngine = (function () {
  var P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  var INF = 32000, MATE = 30000;
  var VAL = [0, 100, 320, 330, 500, 900, 0];
  var VALI = [0, 1, 3, 3, 5, 9, 10];
  var LET = ['', '', 'A', 'F', 'K', 'V', '\u015e'];
  var FILES = 'abcdefgh';

  var b = [], side = 1, cast = 15, ep = -1, half = 0, sp = 0;
  var ksq = [4, 60];
  var uM = [], uP = [], uCap = [], uCast = [], uEp = [], uHalf = [], uCapSq = [];
  var rep = {}, keyStack = [];
  var nodes = 0, aborted = false, deadline = 0;
  var rs = null;

  var NT = [], KT = [], RAYS = [], PA = [[], []];
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  (function init() {
    var ND = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    var s, f, r, i, nf, nr, ray;
    for (s = 0; s < 64; s++) {
      f = s & 7; r = s >> 3;
      NT[s] = []; KT[s] = []; RAYS[s] = []; PA[0][s] = []; PA[1][s] = [];
      for (i = 0; i < 8; i++) {
        nf = f + ND[i][0]; nr = r + ND[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) NT[s].push(nr * 8 + nf);
        nf = f + DIRS[i][0]; nr = r + DIRS[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) KT[s].push(nr * 8 + nf);
        ray = [];
        while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          ray.push(nr * 8 + nf);
          nf += DIRS[i][0]; nr += DIRS[i][1];
        }
        RAYS[s][i] = ray;
      }
      for (i = -1; i <= 1; i += 2) {
        nf = f + i;
        if (nf >= 0 && nf < 8) {
          if (r - 1 >= 0) PA[0][s].push((r - 1) * 8 + nf);
          if (r + 1 < 8) PA[1][s].push((r + 1) * 8 + nf);
        }
      }
    }
  })();

  /* konum degerleri (beyaz gozunden, ust satir = 8. sira) */
  var PST = [];
  PST[1] = [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5,
            0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0];
  PST[2] = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30,
            -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50];
  PST[3] = [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10,
            -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20];
  PST[4] = [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
            -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0];
  PST[5] = [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5,
            0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20];
  var KMG = [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
             -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20];
  var KEG = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30,
             -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

  function now() { return new Date().getTime(); }

  function reset() {
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  function setFen(fen) {
    var parts = fen.split(' '), rows = parts[0].split('/'), i, j, c, f, r, p, map = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
    for (i = 0; i < 64; i++) b[i] = 0;
    for (i = 0; i < 8; i++) {
      r = 7 - i; f = 0;
      for (j = 0; j < rows[i].length; j++) {
        c = rows[i].charAt(j);
        if (c >= '1' && c <= '8') { f += parseInt(c, 10); }
        else {
          p = map[c.toLowerCase()];
          if (c === c.toLowerCase()) p = -p;
          b[r * 8 + f] = p;
          if (p === K) ksq[0] = r * 8 + f;
          if (p === -K) ksq[1] = r * 8 + f;
          f++;
        }
      }
    }
    side = parts[1] === 'b' ? -1 : 1;
    cast = 0;
    if (parts[2]) {
      if (parts[2].indexOf('K') >= 0) cast |= 1;
      if (parts[2].indexOf('Q') >= 0) cast |= 2;
      if (parts[2].indexOf('k') >= 0) cast |= 4;
      if (parts[2].indexOf('q') >= 0) cast |= 8;
    }
    ep = -1;
    if (parts[3] && parts[3] !== '-') ep = (parseInt(parts[3].charAt(1), 10) - 1) * 8 + FILES.indexOf(parts[3].charAt(0));
    half = parts[4] ? parseInt(parts[4], 10) : 0;
    sp = 0; rep = {}; keyStack = [];
    var k = key(); rep[k] = 1; keyStack.push(k);
  }

  function key() { return b.join(',') + ':' + side + ':' + cast + ':' + ep; }

  function attacked(sq, by) {
    var i, j, ray, p, x, l;
    l = PA[by === 1 ? 0 : 1][sq];
    for (i = 0; i < l.length; i++) if (b[l[i]] === by * P) return true;
    l = NT[sq];
    for (i = 0; i < l.length; i++) if (b[l[i]] === by * N) return true;
    l = KT[sq];
    for (i = 0; i < l.length; i++) if (b[l[i]] === by * K) return true;
    for (i = 0; i < 8; i++) {
      ray = RAYS[sq][i];
      for (j = 0; j < ray.length; j++) {
        p = b[ray[j]];
        if (p !== 0) {
          if (p * by > 0) {
            x = p * by;
            if (x === Q || (i < 4 ? x === R : x === B)) return true;
          }
          break;
        }
      }
    }
    return false;
  }

  function inCheck(color) { return attacked(ksq[color === 1 ? 0 : 1], -color); }

  function addP(ms, from, to) {
    if ((side === 1 && to >= 56) || (side === -1 && to < 8)) {
      ms.push(from | (to << 6) | (Q << 12)); ms.push(from | (to << 6) | (R << 12));
      ms.push(from | (to << 6) | (B << 12)); ms.push(from | (to << 6) | (N << 12));
    } else ms.push(from | (to << 6));
  }

  function gen(caps) {
    var ms = [], s, p, t, f, r, one, last, df, nf, to, x, i, j, l, ray, lo, hi;
    for (s = 0; s < 64; s++) {
      p = b[s];
      if (p * side <= 0) continue;
      t = p < 0 ? -p : p;
      f = s & 7; r = s >> 3;
      if (t === P) {
        one = s + 8 * side;
        last = side === 1 ? one >= 56 : one < 8;
        if (b[one] === 0 && (!caps || last)) {
          addP(ms, s, one);
          if (!caps && (side === 1 ? r === 1 : r === 6) && b[one + 8 * side] === 0) ms.push(s | ((one + 8 * side) << 6));
        }
        for (df = -1; df <= 1; df += 2) {
          nf = f + df;
          if (nf < 0 || nf > 7) continue;
          to = one + df;
          if (b[to] * side < 0 || to === ep) addP(ms, s, to);
        }
      } else if (t === N || t === K) {
        l = t === N ? NT[s] : KT[s];
        for (i = 0; i < l.length; i++) {
          to = l[i]; x = b[to];
          if (x === 0) { if (!caps) ms.push(s | (to << 6)); }
          else if (x * side < 0) ms.push(s | (to << 6));
        }
        if (t === K && !caps) {
          if (side === 1 && s === 4) {
            if ((cast & 1) && b[5] === 0 && b[6] === 0 && b[7] === R && !attacked(4, -1) && !attacked(5, -1) && !attacked(6, -1)) ms.push(4 | (6 << 6));
            if ((cast & 2) && b[3] === 0 && b[2] === 0 && b[1] === 0 && b[0] === R && !attacked(4, -1) && !attacked(3, -1) && !attacked(2, -1)) ms.push(4 | (2 << 6));
          } else if (side === -1 && s === 60) {
            if ((cast & 4) && b[61] === 0 && b[62] === 0 && b[63] === -R && !attacked(60, 1) && !attacked(61, 1) && !attacked(62, 1)) ms.push(60 | (62 << 6));
            if ((cast & 8) && b[59] === 0 && b[58] === 0 && b[57] === 0 && b[56] === -R && !attacked(60, 1) && !attacked(59, 1) && !attacked(58, 1)) ms.push(60 | (58 << 6));
          }
        }
      } else {
        lo = t === B ? 4 : 0; hi = t === R ? 4 : 8;
        for (i = lo; i < hi; i++) {
          ray = RAYS[s][i];
          for (j = 0; j < ray.length; j++) {
            to = ray[j]; x = b[to];
            if (x === 0) { if (!caps) ms.push(s | (to << 6)); }
            else { if (x * side < 0) ms.push(s | (to << 6)); break; }
          }
        }
      }
    }
    return ms;
  }

  function make(m) {
    var from = m & 63, to = (m >> 6) & 63, promo = m >> 12, p = b[from], cap = b[to], t = p < 0 ? -p : p, capsq;
    uM[sp] = m; uP[sp] = p; uCap[sp] = cap; uCast[sp] = cast; uEp[sp] = ep; uHalf[sp] = half; uCapSq[sp] = -1;
    b[from] = 0;
    if (t === P && to === ep && cap === 0 && (from & 7) !== (to & 7)) {
      capsq = to - 8 * side;
      uCap[sp] = b[capsq]; uCapSq[sp] = capsq; b[capsq] = 0;
    }
    b[to] = promo ? side * promo : p;
    if (t === K) {
      ksq[side === 1 ? 0 : 1] = to;
      if (to - from === 2) { b[to - 1] = b[to + 1]; b[to + 1] = 0; }
      else if (from - to === 2) { b[to + 1] = b[to - 2]; b[to - 2] = 0; }
      cast &= side === 1 ? ~3 : ~12;
    }
    if (from === 0 || to === 0) cast &= ~2;
    if (from === 7 || to === 7) cast &= ~1;
    if (from === 56 || to === 56) cast &= ~8;
    if (from === 63 || to === 63) cast &= ~4;
    ep = (t === P && (to - from === 16 || from - to === 16)) ? (from + to) >> 1 : -1;
    half = (t === P || cap !== 0 || uCapSq[sp] >= 0) ? 0 : half + 1;
    side = -side;
    sp++;
  }

  function unmake() {
    sp--;
    side = -side;
    var m = uM[sp], from = m & 63, to = (m >> 6) & 63, p = uP[sp], t = p < 0 ? -p : p;
    b[from] = p;
    if (uCapSq[sp] >= 0) { b[to] = 0; b[uCapSq[sp]] = uCap[sp]; }
    else b[to] = uCap[sp];
    if (t === K) {
      ksq[side === 1 ? 0 : 1] = from;
      if (to - from === 2) { b[to + 1] = b[to - 1]; b[to - 1] = 0; }
      else if (from - to === 2) { b[to - 2] = b[to + 1]; b[to + 1] = 0; }
    }
    cast = uCast[sp]; ep = uEp[sp]; half = uHalf[sp];
  }

  /* hamleyi dener: yasalsa true (hamle yapilmis kalir), degilse geri alir */
  function tryMake(m) {
    var mover = side;
    make(m);
    if (inCheck(mover)) { unmake(); return false; }
    return true;
  }

  function legalMoves() {
    var ms = gen(false), out = [], i;
    for (i = 0; i < ms.length; i++) {
      if (tryMake(ms[i])) { unmake(); out.push(ms[i]); }
    }
    return out;
  }

  function hasLegal() {
    var ms = gen(false), i;
    for (i = 0; i < ms.length; i++) {
      if (tryMake(ms[i])) { unmake(); return true; }
    }
    return false;
  }

  function order(ms) {
    var keys = [], i, m, v, a, sc;
    for (i = 0; i < ms.length; i++) {
      m = ms[i]; v = b[(m >> 6) & 63]; a = b[m & 63]; if (a < 0) a = -a; sc = 0;
      if (v !== 0) sc = 10 * VALI[v < 0 ? -v : v] - VALI[a] + 100;
      else if (a === P && (m & 7) !== ((m >> 6) & 7)) sc = 105;
      if (m >> 12) sc += 50 * (m >> 12);
      keys[i] = (sc + 500) * 32768 + m;
    }
    keys.sort(function (x, y) { return y - x; });
    for (i = 0; i < keys.length; i++) ms[i] = keys[i] % 32768;
    return ms;
  }

  function evaluate() {
    var s, p, t, sc = 0, npm = 0, kw = 0, kb = 0, idx;
    for (s = 0; s < 64; s++) {
      p = b[s];
      if (p === 0) continue;
      if (p > 0) {
        if (p === K) { kw = s; continue; }
        if (p > P) npm += VAL[p];
        sc += VAL[p] + PST[p][(7 - (s >> 3)) * 8 + (s & 7)];
      } else {
        t = -p;
        if (t === K) { kb = s; continue; }
        if (t > P) npm += VAL[t];
        sc -= VAL[t] + PST[t][s];
      }
    }
    if (npm < 2600) { sc += KEG[(7 - (kw >> 3)) * 8 + (kw & 7)] - KEG[kb]; }
    else { sc += KMG[(7 - (kw >> 3)) * 8 + (kw & 7)] - KMG[kb]; }
    return side === 1 ? sc : -sc;
  }

  function qs(alpha, beta, d) {
    var stand = evaluate(), ms, i, sc;
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (d === 0) return alpha;
    ms = order(gen(true));
    for (i = 0; i < ms.length; i++) {
      if (!tryMake(ms[i])) continue;
      sc = -qs(-beta, -alpha, d - 1);
      unmake();
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function ab(depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && now() > deadline) aborted = true;
    if (aborted) return 0;
    if (depth <= 0) return qs(alpha, beta, 4);
    var ms = order(gen(false)), i, legal = 0, sc;
    for (i = 0; i < ms.length; i++) {
      if (!tryMake(ms[i])) continue;
      legal++;
      sc = -ab(depth - 1, -beta, -alpha, ply + 1);
      unmake();
      if (aborted) return 0;
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    if (legal === 0) return inCheck(side) ? -MATE + ply : 0;
    return alpha;
  }

  /* kok arama: UI her adimda rootStep() cagirir, aralarda tarayici nefes alir.
     noise=0 ise kademeli derinlesme (1,2,..maxDepth): sure dolsa bile son iyi hamle elde kalir. */
  function rootStart(maxDepth, noise, ms) {
    var moves = order(legalMoves());
    rs = { moves: moves, i: 0, max: maxDepth, depth: noise ? maxDepth : 1, noise: noise,
           best: moves.length ? moves[0] : -1, bestScore: -INF, alpha: -INF };
    nodes = 0; aborted = false; deadline = now() + ms;
  }

  function nextDepth() {
    var i, mv = rs.moves, bi = 0;
    for (i = 0; i < mv.length; i++) if (mv[i] === rs.best) bi = i;
    if (bi > 0) { mv.splice(bi, 1); mv.unshift(rs.best); }
    rs.depth++; rs.i = 0; rs.alpha = -INF; rs.bestScore = -INF;
  }

  function rootStep() {
    if (!rs || rs.moves.length === 0) return false;
    var m = rs.moves[rs.i], sc, k, pen = 0;
    rs.i++;
    make(m);
    k = key();
    if (rep[k] >= 1) pen = -25;
    sc = rs.noise ? -ab(rs.depth - 1, -INF, INF, 1) : -ab(rs.depth - 1, -INF, -rs.alpha, 1);
    unmake();
    if (aborted) return false;
    sc += pen;
    if (rs.noise) sc += Math.floor(Math.random() * (rs.noise * 2 + 1)) - rs.noise;
    if (sc > rs.bestScore) { rs.bestScore = sc; rs.best = m; if (!rs.noise) rs.alpha = sc; }
    if (rs.i < rs.moves.length) return true;
    if (rs.noise || rs.depth >= rs.max || rs.bestScore > MATE - 100) return false;
    nextDepth();
    return true;
  }

  function sqName(s) { return FILES.charAt(s & 7) + ((s >> 3) + 1); }

  /* hamle yazimi (Turkce harfler: A at, F fil, K kale, V vezir, S sah) - hamle yapilmadan once cagrilir */
  function san(m) {
    var from = m & 63, to = (m >> 6) & 63, promo = m >> 12, p = b[from], t = p < 0 ? -p : p;
    var cap = b[to] !== 0 || (t === P && (from & 7) !== (to & 7));
    var s, leg, i, lm, amb = false, sameF = false, sameR = false, mover = side;
    if (t === K && (to - from === 2 || from - to === 2)) s = to > from ? 'O-O' : 'O-O-O';
    else {
      s = '';
      if (t !== P) {
        s = LET[t];
        leg = legalMoves();
        for (i = 0; i < leg.length; i++) {
          lm = leg[i];
          if (lm !== m && ((lm >> 6) & 63) === to && (lm & 63) !== from && (b[lm & 63] === p)) {
            amb = true;
            if ((lm & 7) === (from & 7)) sameF = true;
            if (((lm & 63) >> 3) === (from >> 3)) sameR = true;
          }
        }
        if (amb) {
          if (!sameF) s += FILES.charAt(from & 7);
          else if (!sameR) s += (from >> 3) + 1;
          else s += sqName(from);
        }
      } else if (cap) s = FILES.charAt(from & 7);
      if (cap) s += 'x';
      s += sqName(to);
      if (promo) s += '=' + LET[promo];
    }
    make(m);
    if (inCheck(-mover)) s += hasLegal() ? '+' : '#';
    unmake();
    return s;
  }

  function play(m) {
    make(m);
    var k = key();
    rep[k] = (rep[k] || 0) + 1;
    keyStack.push(k);
  }

  function undo() {
    if (keyStack.length < 2) return false;
    var k = keyStack.pop();
    rep[k]--;
    unmake();
    return true;
  }

  function insufficient() {
    var s, p, t, minors = 0;
    for (s = 0; s < 64; s++) {
      p = b[s]; if (p === 0) continue;
      t = p < 0 ? -p : p;
      if (t === P || t === R || t === Q) return false;
      if (t === N || t === B) minors++;
    }
    return minors <= 1;
  }

  function perft(d) {
    if (d === 0) return 1;
    var ms = gen(false), i, n = 0;
    for (i = 0; i < ms.length; i++) {
      if (!tryMake(ms[i])) continue;
      n += perft(d - 1);
      unmake();
    }
    return n;
  }

  reset();

  return {
    reset: reset, setFen: setFen, perft: perft,
    side: function () { return side; },
    get: function (s) { return b[s]; },
    kingSq: function (c) { return ksq[c === 1 ? 0 : 1]; },
    inCheck: function () { return inCheck(side); },
    legalMoves: legalMoves, san: san, play: play, undo: undo,
    plies: function () { return keyStack.length - 1; },
    half: function () { return half; },
    repeats: function () { return rep[keyStack[keyStack.length - 1]] || 0; },
    insufficient: insufficient,
    rootStart: rootStart, rootStep: rootStep,
    rootBest: function () { return rs ? rs.best : -1; },
    rootInfo: function () { return rs ? [rs.i, rs.moves.length, rs.depth] : [0, 0, 0]; },
    evaluate: evaluate
  };
})();

if (typeof module !== 'undefined') module.exports = ChessEngine;
