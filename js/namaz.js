/* Namaz takvimi - ES3 (BlackBerry OS 5 / Symbian uyumlu). Sabit tablo: 1 Kasim - 31 Aralik 2026.
   Satir: 'YYYY-AA-GG|seher|imsak|sabah sonu|ogle|ikindi|aksam|yatsi|yatsi sonu' */
(function () {
  var D = [
    '2026-11-01|06:02|06:50|07:33|12:49|15:38|18:03|18:47|19:34',
    '2026-11-02|06:04|06:51|07:35|12:49|15:37|18:02|18:46|19:33',
    '2026-11-03|06:05|06:52|07:36|12:49|15:36|18:00|18:44|19:32',
    '2026-11-04|06:06|06:53|07:37|12:49|15:35|17:59|18:43|19:31',
    '2026-11-05|06:07|06:54|07:38|12:49|15:34|17:58|18:42|19:30',
    '2026-11-06|06:08|06:55|07:39|12:49|15:33|17:57|18:41|19:29',
    '2026-11-07|06:09|06:56|07:41|12:49|15:32|17:56|18:40|19:28',
    '2026-11-08|06:10|06:57|07:42|12:49|15:31|17:55|18:39|19:27',
    '2026-11-09|06:11|06:58|07:43|12:49|15:31|17:54|18:38|19:26',
    '2026-11-10|06:12|06:59|07:44|12:49|15:30|17:53|18:37|19:25',
    '2026-11-11|06:13|07:01|07:45|12:49|15:29|17:52|18:37|19:24',
    '2026-11-12|06:14|07:02|07:47|12:49|15:28|17:51|18:36|19:23',
    '2026-11-13|06:15|07:03|07:48|12:49|15:27|17:50|18:35|19:23',
    '2026-11-14|06:16|07:04|07:49|12:49|15:27|17:49|18:34|19:22',
    '2026-11-15|06:17|07:05|07:50|12:50|15:26|17:48|18:33|19:21',
    '2026-11-16|06:18|07:06|07:51|12:50|15:25|17:47|18:33|19:21',
    '2026-11-17|06:19|07:07|07:52|12:50|15:25|17:46|18:32|19:20',
    '2026-11-18|06:20|07:08|07:54|12:50|15:24|17:46|18:31|19:19',
    '2026-11-19|06:21|07:09|07:55|12:50|15:24|17:45|18:30|19:19',
    '2026-11-20|06:22|07:10|07:56|12:51|15:23|17:44|18:30|19:18',
    '2026-11-21|06:23|07:11|07:57|12:51|15:23|17:44|18:29|19:18',
    '2026-11-22|06:24|07:12|07:58|12:51|15:22|17:43|18:29|19:17',
    '2026-11-23|06:25|07:13|07:59|12:51|15:22|17:42|18:28|19:17',
    '2026-11-24|06:26|07:14|08:01|12:52|15:21|17:42|18:28|19:16',
    '2026-11-25|06:27|07:15|08:02|12:52|15:21|17:41|18:27|19:16',
    '2026-11-26|06:28|07:16|08:03|12:52|15:20|17:41|18:27|19:16',
    '2026-11-27|06:29|07:17|08:04|12:53|15:20|17:40|18:27|19:15',
    '2026-11-28|06:30|07:18|08:05|12:53|15:20|17:40|18:26|19:15',
    '2026-11-29|06:31|07:19|08:06|12:53|15:20|17:39|18:26|19:15',
    '2026-11-30|06:32|07:20|08:07|12:54|15:19|17:39|18:26|19:15',
    '2026-12-01|06:32|07:21|08:08|12:54|15:19|17:39|18:25|19:14',
    '2026-12-02|06:33|07:22|08:09|12:54|15:19|17:38|18:25|19:14',
    '2026-12-03|06:34|07:23|08:10|12:55|15:19|17:38|18:25|19:14',
    '2026-12-04|06:35|07:24|08:11|12:55|15:19|17:38|18:25|19:14',
    '2026-12-05|06:36|07:25|08:12|12:56|15:19|17:38|18:25|19:14',
    '2026-12-06|06:37|07:26|08:13|12:56|15:19|17:38|18:25|19:14',
    '2026-12-07|06:38|07:27|08:14|12:56|15:19|17:38|18:25|19:14',
    '2026-12-08|06:38|07:28|08:15|12:57|15:19|17:38|18:25|19:14',
    '2026-12-09|06:39|07:29|08:16|12:57|15:19|17:38|18:25|19:14',
    '2026-12-10|06:40|07:29|08:17|12:58|15:19|17:38|18:25|19:14',
    '2026-12-11|06:41|07:30|08:17|12:58|15:19|17:38|18:25|19:15',
    '2026-12-12|06:41|07:31|08:18|12:59|15:19|17:38|18:25|19:15',
    '2026-12-13|06:42|07:32|08:19|12:59|15:19|17:38|18:25|19:15',
    '2026-12-14|06:43|07:32|08:20|13:00|15:20|17:38|18:26|19:15',
    '2026-12-15|06:43|07:33|08:21|13:00|15:20|17:38|18:26|19:16',
    '2026-12-16|06:44|07:34|08:21|13:00|15:20|17:39|18:26|19:16',
    '2026-12-17|06:45|07:34|08:22|13:01|15:20|17:39|18:27|19:16',
    '2026-12-18|06:45|07:35|08:23|13:01|15:21|17:39|18:27|19:17',
    '2026-12-19|06:46|07:36|08:23|13:02|15:21|17:40|18:27|19:17',
    '2026-12-20|06:46|07:36|08:24|13:02|15:22|17:40|18:28|19:17',
    '2026-12-21|06:47|07:37|08:24|13:03|15:22|17:41|18:28|19:18',
    '2026-12-22|06:47|07:37|08:25|13:03|15:23|17:41|18:29|19:18',
    '2026-12-23|06:48|07:38|08:25|13:04|15:23|17:42|18:29|19:19',
    '2026-12-24|06:48|07:38|08:26|13:04|15:24|17:42|18:30|19:19',
    '2026-12-25|06:49|07:38|08:26|13:05|15:24|17:43|18:30|19:20',
    '2026-12-26|06:49|07:39|08:26|13:05|15:25|17:43|18:31|19:21',
    '2026-12-27|06:50|07:39|08:27|13:06|15:25|17:44|18:32|19:21',
    '2026-12-28|06:50|07:40|08:27|13:06|15:26|17:45|18:32|19:22',
    '2026-12-29|06:50|07:40|08:27|13:07|15:27|17:45|18:33|19:22',
    '2026-12-30|06:51|07:40|08:28|13:07|15:27|17:46|18:34|19:23',
    '2026-12-31|06:51|07:40|08:28|13:08|15:28|17:47|18:34|19:24'
  ];
  var LAB = ['Seher (Fecr-i Kâzib) – Sahura kalkış', 'Sabah (İmsak)', 'Sabah namazı sonu', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Yatsı sonu'];
  var SHORT = ['Seher', 'İmsak', 'S.Son', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Y.Son'];
  var MON = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var DAYN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var rows = [], months = [], cur = 0, allOpen = false, i, p;
  function $(id) { return document.getElementById(id); }
  for (i = 0; i < D.length; i++) {
    p = D[i].split('|');
    rows.push({ y: parseInt(p[0].substring(0, 4), 10), m: parseInt(p[0].substring(5, 7), 10), d: parseInt(p[0].substring(8, 10), 10), t: p.slice(1) });
  }
  function two(n) { return n < 10 ? '0' + n : '' + n; }
  function mIndex(m) { var j; for (j = 0; j < months.length; j++) { if (months[j] === m) { return j; } } return -1; }
  for (i = 0; i < rows.length; i++) { if (mIndex(rows[i].m) < 0) { months.push(rows[i].m); } }
  function find(m, d) { var j; for (j = 0; j < rows.length; j++) { if (rows[j].m === m && rows[j].d === d) { return j; } } return -1; }
  function daysIn(m) { var j, n = 0; for (j = 0; j < rows.length; j++) { if (rows[j].m === m) { n++; } } return n; }
  function dayName(r) { return DAYN[new Date(r.y, r.m - 1, r.d).getDay()]; }

  function fillDays(m, keep) {
    var s = $('ngun'), n = daysIn(m), j, r;
    s.options.length = 0;
    for (j = 1; j <= n; j++) {
      r = rows[find(m, j)];
      s.options[j - 1] = new Option(j + ' ' + MON[m - 1] + ' ' + dayName(r), String(j));
    }
    if (keep > n) { keep = n; }
    if (keep < 1) { keep = 1; }
    s.selectedIndex = keep - 1;
  }
  function show(idx) {
    var r = rows[idx], h, j;
    cur = idx;
    h = '<h3>' + r.d + ' ' + MON[r.m - 1] + ' ' + r.y + ', ' + dayName(r) + '</h3><table class="ntab1">';
    for (j = 0; j < 8; j++) { h += '<tr><th>' + LAB[j] + '</th><td class="nt">' + r.t[j] + '</td></tr>'; }
    h += '</table>';
    $('nsonuc').innerHTML = h;
    if (allOpen) { buildAll(); }
  }
  function buildAll() {
    var r = rows[cur], j, k, h = '<table class="ntab"><tr><th>Gün</th>';
    for (k = 0; k < 8; k++) { h += '<th>' + SHORT[k] + '</th>'; }
    h += '</tr>';
    for (j = 0; j < rows.length; j++) {
      if (rows[j].m !== r.m) { continue; }
      h += '<tr' + (j === cur ? ' class="sel"' : '') + '><td><a href="#" onclick="return Namaz.go(' + j + ')">' + rows[j].d + '</a></td>';
      for (k = 0; k < 8; k++) { h += '<td>' + rows[j].t[k] + '</td>'; }
      h += '</tr>';
    }
    h += '</table>';
    $('ntum').innerHTML = h;
  }
  function sync() {
    var r = rows[cur], mi = mIndex(r.m);
    $('nay').selectedIndex = mi; fillDays(r.m, r.d);
  }
  function pick() {
    var m = months[$('nay').selectedIndex], d = $('ngun').selectedIndex + 1;
    fillDays(m, d); d = $('ngun').selectedIndex + 1;
    show(find(m, d));
    return false;
  }
  function go(idx) {
    if (idx < 0 || idx >= rows.length) { return false; }
    cur = idx; sync(); show(idx); return false;
  }
  function today() {
    var n = new Date(), j;
    for (j = 0; j < rows.length; j++) {
      if (rows[j].y === n.getFullYear() && rows[j].m === n.getMonth() + 1 && rows[j].d === n.getDate()) { return go(j); }
    }
    return go(0);
  }
  function toggle() {
    allOpen = !allOpen;
    $('ntum').style.display = allOpen ? 'block' : 'none';
    $('ntgl').innerHTML = allOpen ? 'Ayın tamamını gizle' : 'Ayın tamamını göster';
    if (allOpen) { buildAll(); }
    return false;
  }
  function init() {
    var s = $('nay'), j, n = new Date(), start = 0;
    for (j = 0; j < months.length; j++) { s.options[j] = new Option(MON[months[j] - 1] + ' ' + rows[find(months[j], 1)].y, String(months[j])); }
    for (j = 0; j < rows.length; j++) {
      if (rows[j].y === n.getFullYear() && rows[j].m === n.getMonth() + 1 && rows[j].d === n.getDate()) { start = j; }
    }
    go(start);
    $('ntk').style.display = 'block';
    var nj = $('nojs'); if (nj) { nj.style.display = 'none'; }
  }
  window.Namaz = {
    pick: pick, go: go, today: today, toggle: toggle,
    prev: function () { return go(cur - 1); }, next: function () { return go(cur + 1); }
  };
  if (window.addEventListener) { window.addEventListener('load', init, false); } else { window.onload = init; }
})();
