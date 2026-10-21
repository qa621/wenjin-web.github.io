/* 《问津》 —— act3.js
 * 第三幕 · 桃源村与归途：纪年木牌、设酒杀鸡、墙上旧志、三处岔路记忆、抹志与双结局
 */
'use strict';

var ERA = ['周', '秦', '汉', '魏', '晋', '唐'];
var ERA_ANS = ['周', '秦', '汉', '魏', '晋'];
function renderEra(s) {
  showPopup(s.intro, null);
  var order = ERA.slice();
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  var placed = [];
  var row = el('div', 'eraRow');
  var slots = [];
  for (var k = 0; k < ERA_ANS.length; k++) {
    var sl = el('div', 'eraslot');
    row.appendChild(sl); slots.push(sl);
  }
  layer.appendChild(row);
  var tray = el('div', 'eraTiles');
  var tiles = [];
  order.forEach(function (ch) {
    var t = el('div', 'eraT');
    t.textContent = ch;
    t.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'era' || popupEl) { return; }
      if (t.classList.contains('used')) { return; }
      if (ch !== ERA_ANS[placed.length]) {
        SFX.wrong();
        t.classList.remove('wrong');
        void t.offsetWidth;            /* 重启动画 */
        t.classList.add('wrong');
        setTimeout(function () { t.classList.remove('wrong'); }, 460);
        toast(ch === '唐' ? '「唐」不是我们记的年号，再想想。' : '这个朝代不对，再想想。');
        return;
      }
      t.classList.add('used');
      slots[placed.length].textContent = ch;
      slots[placed.length].classList.add('full');
      placed.push(ch); SFX.ding();
      if (placed.length >= ERA_ANS.length) { go(s.next); }
    });
    tiles.push(t);
    tray.appendChild(t);
  });
  layer.appendChild(tray);
  hideText();
}

/* 设酒杀鸡 */
var FEAST = [
  { k:'wine',    img:'feast-wine.png',    ok:true },
  { k:'chicken', img:'feast-chicken.png', ok:true },
  { k:'greens',  img:'feast-greens.png',  ok:true },
  { k:'tofu',    img:'feast-tofu.png',    ok:false },
  { k:'pickle',  img:'feast-pickle.png',  ok:false }
];
var FEAST_SEQ = ['wine', 'chicken', 'greens'];
var FEAST_RULE = '老人说：先敬酒 → 再上鸡 → 最后才动菜';
function renderFeast(s) {
  showPopup(s.intro, null);
  label(FEAST_RULE);
  var served = [], fails = 0;
  var bar = el('div', 'feast');
  var dishes = FEAST.slice();
  for (var i = dishes.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = dishes[i]; dishes[i] = dishes[j]; dishes[j] = tmp;
  }
  function markNext() {
    var want = FEAST_SEQ[served.length];
    eachChild(bar, function (c) {
      if (fails >= 1 && c.__k === want) { c.classList.add('next'); } else { c.classList.remove('next'); }
    });
  }
  dishes.forEach(function (d) {
    var node = el('div', 'dish');
    node.__k = d.k;
    node.style.backgroundImage = "url('assets/" + d.img + "')";
    node.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'feast' || popupEl) { return; }
      if (node.classList.contains('off')) { return; }
      if (!d.ok) { SFX.wrong(); showPopup('主人摆摆手：「这些，且不忙着上。」', null); return; }
      if (d.k !== FEAST_SEQ[served.length]) {
        SFX.wrong(); fails++;
        served = [];
        eachChild(bar, function (c) { c.classList.remove('served'); });
        showPopup(fails >= 2 ? FEAST_RULE : s.hint, null);
        markNext();
        return;
      }
      node.classList.add('served'); node.classList.remove('next');
      served.push(d.k); SFX.collect();
      markNext();
      if (served.length >= FEAST_SEQ.length) {
        eachChild(bar, function (c) { c.classList.add('off'); });
        go(s.next);
      }
    });
    bar.appendChild(node);
  });
  layer.appendChild(bar);
  hideText();
}

/* 墙上旧志 */
function renderOldMarks(s) {
  showPopup(s.intro, null);
  var spots = [{ x:24, y:40 }, { x:45, y:34 }, { x:66, y:42 }];
  var found = 0;
  spots.forEach(function (p, i) {
    var m = el('div', 'oldmark');
    m.style.left = p.x + '%'; m.style.top = p.y + '%';
    m.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'oldmarks' || popupEl) { return; }
      if (m.classList.contains('found')) { return; }
      m.classList.add('found');
      found++; SFX.rustle(0.05);
      showPopup(s.lines[i] || '……', function () {
        if (found >= spots.length) { sawOld = true; go(s.next); }
      });
    });
    layer.appendChild(m);
  });
  hideText();
}

/* 终章 · 岔路：凭来时的记忆选路；留下的志越多，提示越明显 */
var FORKS = [
  { q:'第一条岔路', paths:['沿溪而下', '翻过石坡', '穿过桃林'], right:0 },
  { q:'第二条岔路', paths:['向左的窄径', '向上的石阶', '向右的塌方'], right:2 },
  { q:'第三条岔路', paths:['贴壁绕行', '涉水过去', '退回原处'], right:1 }
];
function renderForks(s) {
  var idx = 0, errs = 0;
  function draw() {
    while (layer.firstChild) { layer.removeChild(layer.firstChild); }
    popupEl = null;
    var f = FORKS[idx];
    label(f.q + '　（第 ' + (idx + 1) + ' / ' + FORKS.length + ' 处）走错了会退回第一处');
    var bar = el('div', 'forkbar');
    f.paths.forEach(function (name, i) {
      var p = el('div', 'path' + (i === f.right ? ' cue' : '') +
                 (i === f.right && (marks > 0 || errs >= 1) ? ' lit' : ''));
      p.textContent = name;
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!cur || cur.type !== 'forks' || popupEl) { return; }
        if (i === f.right) {
          SFX.wood();
          idx++;
          if (idx >= FORKS.length) { go(s.next); } else { draw(); }
        } else {
          errs++; SFX.wrong();
          idx = 0; draw();
          showPopup(errs >= 2 ? '顺着落花的方向走。' : s.hint, null);
        }
      });
      bar.appendChild(p);
    });
    layer.appendChild(bar);
    hideText();
  }
  draw();
  showPopup(s.intro, null);
}

/* 幕3：后来的先散去 */
function renderMarks(s) {
  var spots = [{ x:26, y:52 }, { x:45, y:58 }, { x:64, y:52 }];
  var shown = Math.min(marks, spots.length);
  var next = shown;
  var done = 0, errs = 0;
  var nodes = [];
  label('抹去痕迹：从最后留下的那枚开始；点错了会亮出该点的那枚');
  function markNext() {
    nodes.forEach(function (n) {
      if (errs >= 1 && n.__idx === next) { n.classList.add('next'); } else { n.classList.remove('next'); }
    });
  }
  for (var i = 0; i < shown; i++) {
    (function (i) {
      var idx = i + 1;
      var m = el('img', 'mark');
      m.__idx = idx;
      nodes.push(m);
      m.src = img('seal');
      m.style.left = spots[i].x + '%'; m.style.top = spots[i].y + '%';
      m.addEventListener('click', function (e) {
        e.stopPropagation();
        if (m.classList.contains('gone')) { return; }
        if (idx !== next) {
          errs++;
          m.classList.add('wrong'); SFX.wrong();
          setTimeout(function () { m.classList.remove('wrong'); }, 400);
          markNext();
          showPopup(errs >= 2 ? '发光的那一枚，才是最后留下的。' : '后来的，先散去。', null);
          return;
        }
        m.classList.add('gone');
        marks = Math.max(0, marks - 1); next--; done++;
        SFX.rustle(0.06);
        markNext();
        if (done >= shown) { go(s.next); }
      });
      layer.appendChild(m);
    })(i);
  }
  var leave = el('div', 'mini');
  leave.textContent = '就这样走';
  leave.addEventListener('click', function (e) { e.stopPropagation(); go('c4'); });
  layer.appendChild(leave);
  if (shown === 0) { go('c0'); }
  hideText();
}
