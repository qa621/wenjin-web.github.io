/* 《问津》 —— endings.js
 * 结局存档与回顾：通关某个结局时自动记下名称与时间（localStorage: wenjin_endings）。
 * 标题页右下角出现"结局回顾"，可以重看已解锁的结局；未解锁显示为灰色剪影。
 */
'use strict';

var ENDINGS = [
  { key: 'A', name: '守口', first: 'endA1', hint: '你替他们，守住了最后一口气。' },
  { key: 'B', name: '告官', first: 'endB1', hint: '你带出去的那个名字，还在人嘴里。' }
];

var endingStore = {};
try {
  endingStore = JSON.parse(localStorage.getItem('wenjin_endings') || '{}') || {};
} catch (e) {
  endingStore = {};
}
var endingPanelEl = null;
var reviewBtnEl = document.getElementById('reviewBtn');

/* 解锁：只记第一次；没有 localStorage 时静默降级，不影响通关 */
function endingSave(k) {
  if (endingStore[k]) { return; }
  var d = new Date();
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  endingStore[k] = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                   ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  try { localStorage.setItem('wenjin_endings', JSON.stringify(endingStore)); } catch (e) { /* 忽略 */ }
}

function setReviewButton(on) {
  if (!reviewBtnEl) { return; }
  if (on) { reviewBtnEl.classList.add('on'); } else { reviewBtnEl.classList.remove('on'); }
}

/* 两个结局都解锁了吗 */
function bothEndingsSeen() { return !!(endingStore.A && endingStore.B); }

function openEndPanel() {
  if (endingPanelEl) { return; }
  var p = el('div', 'endPanel');
  var h = el('div', 'endTitle'); h.textContent = '结局回顾';
  p.appendChild(h);
  ENDINGS.forEach(function (e) {
    var unlocked = !!endingStore[e.key];
    var row = el('div', 'endRow' + (unlocked ? '' : ' locked'));
    var n = el('div', 'endName');
    n.textContent = unlocked ? ('结局 · ' + e.name) : '？？？';
    var t = el('div', 'endTime');
    t.textContent = unlocked ? (e.hint + '　·　' + endingStore[e.key]) : '尚未达成';
    row.appendChild(n); row.appendChild(t);
    if (unlocked) {
      row.addEventListener('click', function (ev) {
        ev.stopPropagation();
        closeEndPanel();
        go(e.first);
      });
    }
    p.appendChild(row);
  });
  var c = el('div', 'endClose'); c.textContent = '关闭';
  c.addEventListener('click', function (ev) { ev.stopPropagation(); closeEndPanel(); });
  /* 至少解锁一个结局：给一条直接回到岔路口的路 */
  if (endingStore.A || endingStore.B) {
    var back = el('div', 'endBack');
    back.textContent = '回到岔路口 · 看看另一种选择';
    back.addEventListener('click', function (ev) { ev.stopPropagation(); closeEndPanel(); go('c5'); });
    p.appendChild(back);
  }
  /* 双结局集齐：《两境·跋》 */
  if (bothEndingsSeen() && TEXTS.bilogue) {
    var bi = el('div', 'bilogue');
    var bt = el('div', 'bilogueTitle'); bt.textContent = TEXTS.bilogue.title;
    var bb = el('div', 'bilogueBody'); bb.textContent = TEXTS.bilogue.body;
    bi.appendChild(bt); bi.appendChild(bb);
    p.appendChild(bi);
  }
  p.appendChild(c);
  p.addEventListener('click', function (ev) { ev.stopPropagation(); });
  layer.appendChild(p);
  endingPanelEl = p;
}

function closeEndPanel() {
  if (endingPanelEl && endingPanelEl.parentNode) { endingPanelEl.parentNode.removeChild(endingPanelEl); }
  endingPanelEl = null;
}

if (reviewBtnEl) {
  reviewBtnEl.addEventListener('click', function (e) {
    e.stopPropagation();
    openEndPanel();
  });
}
