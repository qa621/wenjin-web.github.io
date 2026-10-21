/* 《问津》 —— act1.js
 * 第一幕 · 桃林：探索三处景物、点击桃枝落花、拾花瓣、从花瓣里找枯叶
 */
'use strict';

/* ================= 花瓣 / 枯叶 ================= */
var SWAY = ['swayA', 'swayB', 'swayC'];
function clearPetals() {
  if (fallTimer) { clearInterval(fallTimer); fallTimer = null; }
  if (rustleTimer) { clearInterval(rustleTimer); rustleTimer = null; }
  petalNodes = [];
}
function spawnPetal(clickable, leftPct, fast) {
  var wrap = el('div', 'pfall' + (clickable ? ' collect' : ''));
  var inner = el('div', 'petal');
  var ground = 74 + Math.random() * 16;
  var depth = (ground - 74) / 16;
  var w = (1.9 + Math.random() * 1.6) * (0.7 + depth * 0.8);
  var dur = fast ? (2.2 + Math.random() * 2.4) : (3.6 + Math.random() * 4.4);
  wrap.style.left = (leftPct == null ? Math.random() * 94 : leftPct) + '%';
  wrap.style.width = w.toFixed(2) + '%';
  wrap.style.top = '-14%';
  wrap.style.transform = 'scaleX(' + (Math.random() < 0.5 ? -1 : 1) + ')';
  inner.style.animation = SWAY[Math.floor(Math.random() * 3)] + ' ' +
    (2 + Math.random() * 1.8).toFixed(2) + 's ease-in-out infinite alternate';
  inner.style.filter = 'hue-rotate(' + Math.round(Math.random() * 26 - 13) + 'deg) saturate(' +
    (0.75 + Math.random() * 0.55).toFixed(2) + ') blur(' + ((1 - depth) * 0.9).toFixed(2) + 'px)';
  inner.style.opacity = (0.75 + depth * 0.25).toFixed(2);
  wrap.appendChild(inner);
  if (clickable) {
    wrap.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'petals') { return; }
      if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); }
      petals = Math.min(needPetals, petals + 1);
      updateHud(); renderTools(); SFX.collect();
      if (petals >= needPetals) { go(cur.next); }
    });
  }
  layer.appendChild(wrap);
  petalNodes.push(wrap);
  while (petalNodes.length > 46) {
    var old = petalNodes.shift();
    if (old && old.parentNode) { old.parentNode.removeChild(old); }
  }
  setTimeout(function () {
    if (!wrap.parentNode) { return; }
    wrap.style.transition = 'top ' + dur.toFixed(2) + 's cubic-bezier(0.32,0.04,0.56,1)';
    wrap.style.top = ground.toFixed(1) + '%';
  }, 20 + Math.random() * 140);
  return wrap;
}
function startFall(clickable) {
  clearPetals();
  fallTimer = setInterval(function () { spawnPetal(clickable); }, 300);
  rustleTimer = setInterval(function () { SFX.rustle(0.05); }, 1900);
}
function petalBurst(n) {
  SFX.rustle(0.16);
  for (var i = 0; i < n; i++) {
    (function (i) {
      setTimeout(function () {
        if (!cur || cur.type !== 'explore') { return; }
        spawnPetal(false, 5 + Math.random() * 32, true);
      }, i * 38);
    })(i);
  }
}
function spawnLeaf(delay) {
  setTimeout(function () {
    if (!cur || cur.type !== 'leaves') { return; }
    var leaf = el('div', 'leaf');
    leaf.style.left = (14 + Math.random() * 70) + '%';
    leaf.style.animationDuration = (7 + Math.random() * 3) + 's';
    leaf.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'leaves') { return; }
      if (leaf.classList.contains('taken')) { return; }
      leaf.classList.add('taken');
      SFX.rustle(0.07); wrong = 0; leavesLeft--;
      if (leavesLeft <= 0) { go(cur.next); }
    });
    layer.appendChild(leaf);
    /* 枯叶飘出画面还没被点中：这一枚作废，重新再来一片，避免卡死 */
    var dur = parseFloat(leaf.style.animationDuration) * 1000;
    setTimeout(function () {
      if (leaf.classList.contains('taken')) { return; }
      if (leaf.parentNode) { leaf.parentNode.removeChild(leaf); }
      if (cur && cur.type === 'leaves') { spawnLeaf(0); }
    }, dur + 300);
  }, delay);
}

function renderExplore(s) {
  var done = {};
  Object.keys(s.items).forEach(function (k) {
    var it = s.items[k];
    var d = el('div', 'hotspot');
    d.style.left = it.x + '%'; d.style.top = it.y + '%';
    d.style.width = it.w + '%'; d.style.height = it.h + '%';
    d.addEventListener('click', function (e) {
      e.stopPropagation();
      if (k === 'stream' && !done.branch) { showPopup('那株桃枝，先去碰一碰。', null); return; }
      if (it.burst) { petalBurst(28); }
      if (it.water) { SFX.waterStart(); }
      if (done[k]) { return; }
      showPopup(it.text, function () {
        done[k] = true;
        if (done.branch && done.stream) { go(s.next); }
      });
    });
    layer.appendChild(d);
  });
  hideText();
}

function renderPetals(s) {
  startFall(true);
  showPopup('溪水在这里断了。石缝里嵌着一块青石，上面凿着五个花瓣形的凹坑——像是等着什么填进去。\n你忽然就明白了：这些花瓣，正是要填进去的东西。', null);
  hideText();
}

function renderLeaves(s) {
  startFall(false);
  leavesLeft = s.count;
  for (var i = 0; i < s.count; i++) { spawnLeaf(400 + i * 900); }
  var miss = el('div');
  miss.style.position = 'absolute'; miss.style.inset = '0'; miss.style.zIndex = '10';
  miss.addEventListener('click', function (e) {
    e.stopPropagation();
    if (popupEl) { return; }
    wrong++;
    if (wrong >= 3) {
      eachChild(layer, function (c) {
        if (c.classList && c.classList.contains('leaf')) { c.classList.add('hint'); }
      });
    }
    showPopup(s.hint, null);
  });
  layer.appendChild(miss);
  hideText();
}
