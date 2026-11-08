(function () {
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var PIN = ['stremio','youtube','netflix','prime','hotstar','jio'];   // shelf order, first = leftmost
  var LAT = 19.076, LON = 72.8777;                                     // Mumbai
  var SLOT = 168, VIEW = 1600, apps = [], idx = 0;
  var row = document.getElementById('row');
  function $(i) { return document.getElementById(i); }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var d = new Date(), h = d.getHours();
    $('time').innerHTML = (h % 12 || 12) + ':' + p2(d.getMinutes()) + ' <small>' + (h >= 12 ? 'PM' : 'AM') + '</small>';
    $('date').textContent = DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()];
  }
  function desc(c) {
    if (c === 0) return 'Clear'; if (c < 4) return 'Cloudy'; if (c === 45 || c === 48) return 'Fog';
    if (c >= 51 && c <= 57) return 'Drizzle'; if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return 'Rain';
    if (c >= 95) return 'Storm'; return '';
  }
  function weather() {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
        '&current_weather=true&timezone=Asia%2FKolkata');
      x.onload = function () {
        try {
          var c = JSON.parse(x.responseText).current_weather, t = desc(c.weathercode);
          $('temp').textContent = Math.round(c.temperature) + '\u00B0C' + (t ? ' \u00B7 ' + t : '');
        } catch (e) {}
      };
      x.send();
    } catch (e) {}
  }

  function pin(a) {
    var n = a.name.toLowerCase();
    for (var i = 0; i < PIN.length; i++) if (n.indexOf(PIN[i]) > -1) return i;
    return 99;
  }
  function letter(el, n) { el.innerHTML = ''; var b = document.createElement('b'); b.textContent = n.charAt(0); el.appendChild(b); }
  function icon(el, a) {
    if (!a.iconPath) return letter(el, a.name);
    var im = new Image(), tried = false;
    im.onerror = function () {
      if (!tried && a.iconPath.charAt(0) === '/') { tried = true; im.src = 'file://' + a.iconPath; }
      else letter(el, a.name);
    };
    im.src = a.iconPath; el.appendChild(im);
  }
  function draw() {
    row.innerHTML = '';
    for (var i = 0; i < apps.length; i++) {
      var t = document.createElement('div'), ic = document.createElement('div'), l = document.createElement('div');
      t.className = 'tile'; ic.className = 'ico'; l.className = 'lbl'; l.textContent = apps[i].name;
      icon(ic, apps[i]); t.appendChild(ic); t.appendChild(l); row.appendChild(t);
    }
    row.style.width = (apps.length * SLOT + 40) + 'px';
    focus(Math.min(idx, apps.length - 1));
  }
  function focus(i) {
    var tiles = row.children;
    if (!tiles.length) return;
    idx = Math.max(0, Math.min(tiles.length - 1, i));
    for (var k = 0; k < tiles.length; k++) tiles[k].className = 'tile' + (k === idx ? ' on' : '');
    var tx = Math.min(0, Math.max(VIEW - (tiles.length * SLOT + 40), VIEW / 2 - (idx * SLOT + SLOT / 2 + 20)));
    row.style.webkitTransform = row.style.transform = 'translateX(' + tx + 'px)';
  }
  function load() {
    if (!window.tizen) {  // browser preview
      apps = [{name:'Stremio'},{name:'YouTube'},{name:'Netflix'},{name:'Prime Video'},{name:'Settings'}]; return draw();
    }
    tizen.application.getAppsInfo(function (list) {
      var me = tizen.application.getCurrentApplication().appInfo.id; apps = [];
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.id !== me && a.name && a.show !== false) apps.push(a);
      }
      apps.sort(function (a, b) { var x = pin(a), y = pin(b); return x !== y ? x - y : (a.name < b.name ? -1 : 1); });
      draw();
    }, function () {});
  }

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (k === 37) focus(idx - 1);
    else if (k === 39) focus(idx + 1);
    else if (k === 13 && window.tizen && apps[idx]) tizen.application.launch(apps[idx].id, function () {}, function () {});
    else if (k === 10009 && window.tizen) tizen.application.getCurrentApplication().exit();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { tick(); load(); } });

  tick(); setInterval(tick, 10000); weather(); setInterval(weather, 900000); load();
})();
