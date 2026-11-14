/* Konu arama (ES3, OS 5 uyumlu) */
function trLower(s) {
  s = s.replace(/İ/g, 'i').replace(/I/g, 'ı');
  return s.toLowerCase();
}

function updateList() {
  var input = document.getElementById('subject-search');
  var count = document.getElementById('result-count');
  var empty = document.getElementById('empty-state');
  var items = document.getElementsByTagName('li');
  var q = trLower(input.value.replace(/^\s+|\s+$/g, ''));
  var visible = 0, i, it, t, match;

  for (i = 0; i < items.length; i++) {
    it = items[i];
    t = trLower(it.innerText || it.textContent || '');
    match = (q === '') || (t.indexOf(q) > -1);
    if (match) { removeClass(it, 'hidden'); visible++; } else { addClass(it, 'hidden'); }
  }
  count.innerHTML = visible;
  if (visible === 0 && q !== '') { addClass(empty, 'visible'); } else { removeClass(empty, 'visible'); }
}

function initSearch() {
  var input = document.getElementById('subject-search');
  if (!input) { return; }
  input.onkeyup = updateList;
  input.onchange = updateList;
  input.oninput = updateList;
  updateList();
}
