/* 《问津》 —— effect.js
 * 界面效果：古卷工具栏（收集物与拖动）、按钮与落款、涟漪、提示条、弹窗
 * 与画面无关的交互都在这里
 */
'use strict';

var PETAL_ROT = [-18, 12, -6, 20, -12];
var PETAL_SC  = [1, 0.92, 1.06, 0.95, 1.02];
/* 工具栏：只列出“已经收到的东西”，按收得的先后排列，没有空格子、没有外框 */
function renderTools() {
  while (cellsEl.firstChild) { cellsEl.removeChild(cellsEl.firstChild); }
  var i, c;
  for (i = 0; i < petals; i++) {
    c = el('div', 'cell petal');
    c.style.backgroundImage = "url('assets/petal.png')";
    c.style.transform = 'rotate(' + PETAL_ROT[i % PETAL_ROT.length] + 'deg) scale(' +
                        PETAL_SC[i % PETAL_SC.length] + ')';
    c.addEventListener('pointerdown', onPetalDown);
    c.addEventListener('mousedown', onPetalDown);
    c.addEventListener('click', function (e) {
      e.stopPropagation();
      if (Date.now() < lockUntil) { return; }
      pickUpPetal();
    });
    cellsEl.appendChild(c);
  }
  for (i = 0; i < flints; i++) {
    c = el('div', 'cell flint');
    c.style.backgroundImage = "url('assets/flint-set.png')";
    cellsEl.appendChild(c);
  }
  if (torchGot) {
    c = el('div', 'cell torch');
    c.style.backgroundImage = "url('assets/torch-new.png')";
    cellsEl.appendChild(c);
  }
}

function aimNotches(on) {
  eachDeep(layer, function (n) {
    if (n.classList && n.classList.contains('notch')) {
      if (on) { n.classList.add('aim'); } else { n.classList.remove('aim'); }
    }
  });
}

function hint(text) {
  var hb = document.getElementById('hintbar');
  if (hb) { hb.textContent = text; }
}
/* 目标条：随时告诉玩家现在该做什么，放在画面正上方 */
function holdGlow(on) {
  if (on) { cellsEl.classList.add('holding'); } else { cellsEl.classList.remove('holding'); }
}

/* 拿起一片花瓣（手上拿着），然后拖到凹槽、或再点凹槽都能放下 */
function pickUpPetal() {
  if (!cur || cur.type !== 'lock' || petals <= 0) { return; }
  handPetal = true;
  dragEl.classList.add('hand');
  aimNotches(true);
  holdGlow(true);
  hint('花瓣在手上 · 拖到凹槽或直接点凹槽放下');
  tip('已拿起花瓣。点凹槽，放下。', 2600);
}

/* 凹槽的 left/top 是相对石锁的百分比，得换算成相对整个画面的百分比才能跟指针比 */
function notchStagePos(n) {
  var lockEl = document.getElementById('lock');
  if (!lockEl || !lockEl.getBoundingClientRect || !stage.getBoundingClientRect) { return null; }
  var lr, sr;
  try { lr = lockEl.getBoundingClientRect(); sr = stage.getBoundingClientRect(); } catch (x) { return null; }
  if (!lr || !sr || !lr.width || !sr.width) { return null; }
  var nx = parseFloat(n.style.left), ny = parseFloat(n.style.top);
  if (isNaN(nx) || isNaN(ny)) { return null; }
  var px = lr.left + (nx / 100) * lr.width;
  var py = lr.top + (ny / 100) * lr.height;
  return { x: ((px - sr.left) / sr.width) * 100, y: ((py - sr.top) / sr.height) * 100 };
}
/* 落点宽容：换算后离凹槽 12% 以内都算放上 */
function nearestNotch(xPct, yPct) {
  var best = null, bd = 12;
  eachDeep(layer, function (n) {
    if (!n.classList || !n.classList.contains('notch') || n.classList.contains('filled')) { return; }
    var p = notchStagePos(n);
    if (!p) { return; }
    var d = Math.sqrt((p.x - xPct) * (p.x - xPct) + (p.y - yPct) * (p.y - yPct));
    if (d < bd) { bd = d; best = n; }
  });
  return best;
}
function onPetalDown(e) {
  if (e && e.stopPropagation) { e.stopPropagation(); }
  pickUpPetal();
  if (dragActive) { return; }
  dragActive = true;
  if (e && e.clientX != null) { moveDrag(e); }
  try {
    document.addEventListener('pointermove', moveDrag);
    document.addEventListener('pointerup', dropDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', dropDrag);
    document.addEventListener('touchmove', moveDrag);
    document.addEventListener('touchend', dropDrag);
  } catch (x) {}
}
function stopTrack() {
  dragActive = false;
  try {
    document.removeEventListener('pointermove', moveDrag);
    document.removeEventListener('pointerup', dropDrag);
    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('mouseup', dropDrag);
    document.removeEventListener('touchmove', moveDrag);
    document.removeEventListener('touchend', dropDrag);
  } catch (x) {}
}
function moveDrag(e) {
  if (!handPetal) { return; }
  var pt = e;
  if (pt && pt.touches && pt.touches.length) { pt = pt.touches[0]; }
  if (!pt || pt.clientX == null || !stage.getBoundingClientRect) { return; }
  var r = stage.getBoundingClientRect();
  if (!r || !r.width) { return; }
  dragEl.style.left = (((pt.clientX - r.left) / r.width) * 100) + '%';
  dragEl.style.top = (((pt.clientY - r.top) / r.height) * 100) + '%';
}
function endDrag() {
  stopTrack();
  handPetal = false;
  dragEl.classList.remove('hand');
  aimNotches(false);
  holdGlow(false);
  hint('点花瓣→拿起。点凹槽→嵌入。');
}
function dropDrag(e) {
  if (!handPetal) { return; }
  var pt = e;
  if (pt && pt.changedTouches && pt.changedTouches.length) { pt = pt.changedTouches[0]; }
  var target = null, pos = null;
  try {
    if (document.elementFromPoint && pt && pt.clientX != null) {
      target = document.elementFromPoint(pt.clientX, pt.clientY);
    }
  } catch (x) {}
  if (pt && pt.clientX != null && stage.getBoundingClientRect) {
    try {
      var r2 = stage.getBoundingClientRect();
      if (r2 && r2.width) {
        pos = { x: ((pt.clientX - r2.left) / r2.width) * 100, y: ((pt.clientY - r2.top) / r2.height) * 100 };
      }
    } catch (x) {}
  }
  stopTrack();
  var node = target;
  while (node && node !== stage) {
    if (node.classList && node.classList.contains('notch')) { lockUntil = Date.now() + 350; fillNotch(node); return; }
    node = node.parentNode;
  }
  if (pos) {
    var near = nearestNotch(pos.x, pos.y);
    if (near) { lockUntil = Date.now() + 350; fillNotch(near); return; }
  }
  /* 落在别处：花瓣仍留在手上，等下一次点凹槽时放下 */
}

function renderButtons(s) {
  var n = s.buttons.length;
  s.buttons.forEach(function (b, i) {
    var d = el('div', 'btn' + (b.minor ? ' minor' : ''));
    d.textContent = b.label;
    d.style.top = (n === 1 ? 48 : 38 + i * 18) + '%';
    /* 双结局都看过时，副按钮换成“已见过两种命运” */
    if (b.go === 'c5' && typeof bothEndingsSeen === 'function' && bothEndingsSeen()) {
      d.textContent = '已见过两种命运';
    }
    d.addEventListener('click', function (e) { e.stopPropagation(); go(b.go); });
    layer.appendChild(d);
  });
}

function renderSign(s) {
  showText(s.text);
  var b = el('div', 'btn seal');
  b.textContent = '志';
  b.style.top = '28%';
  b.addEventListener('click', function (e) {
    e.stopPropagation();
    if (marks < 3) { marks++; updateHud(); toast('已落款 · 志 ' + marks); }
    else { toast('志 已满三'); }
    setTimeout(function () { go(s.next); }, 450);
  });
  layer.appendChild(b);
  lockUntil = Date.now() + 600;
}
