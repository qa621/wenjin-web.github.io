/* 《问津》 —— seals.js
 * 印章系统：三枚印章（入津 / 民风 / 归心），获得时弹说明卡，收进工具栏顶部的印章栏。
 * 获得的印章永久保留（localStorage: wenjin_seals），重开游戏也会显示。
 */
'use strict';

var SEAL_ORDER = ['rujin', 'minfeng', 'guixin'];
var SEAL_NUM = ['一', '二', '三'];
var sealStore = {};
var sealBarEl = document.getElementById('sealbar');
var sealCardEl = null, sealCardTimer = null;

/* 读存档：localStorage 不可用时静默降级（不影响游戏） */
/* 本轮已收集的印章：每次开局从空开始（重玩可再收），
   同时写进 localStorage 只作记录，但**不再用它阻挡发放** */
sealStore = {};
function sealSave() {
  try { localStorage.setItem('wenjin_seals', JSON.stringify(sealStore)); } catch (e) { /* 忽略 */ }
}
function sealHas(k) { return !!sealStore[k]; }

/* 印章栏：只显示已收集的印章（一枚一枚出现，不占位） */
function buildSealBar() {
  if (!sealBarEl) { return; }
  while (sealBarEl.firstChild) { sealBarEl.removeChild(sealBarEl.firstChild); }
  SEAL_ORDER.forEach(function (k) {
    if (!sealStore[k]) { return; }
    var d = el('div', 'sealMini on');
    d.title = TEXTS.seals[k].name;
    d.addEventListener('click', function (e) {
      e.stopPropagation();
      showSealCard(k, true);
    });
    sealBarEl.appendChild(d);
  });
  sealBarEl.style.display = sealBarEl.children.length ? 'flex' : 'none';
}

/* 获得印章：存档 + 音效 + 发光 + 弹卡 */
function awardSeal(k) {
  if (sealStore[k] || !TEXTS.seals[k]) { return; }
  sealStore[k] = Date.now();
  sealSave();
  buildSealBar();
  if (typeof SFX !== 'undefined' && SFX && SFX.ding) { SFX.ding(); }
  var mini = sealBarEl && sealBarEl.lastChild;
  if (mini) {
    mini.classList.remove('pop');
    void mini.offsetWidth;
    mini.classList.add('pop');
  }
  showSealCard(k, false);
}

/* 说明卡：停留 3 秒自动消失，也可点击任意处关闭 */
function showSealCard(k, replay) {
  var d = TEXTS.seals[k];
  if (!d || sealCardEl) { return; }
  var card = el('div', 'sealCard');
  var art = el('div', 'sealArt');
  var name = el('div', 'sealName');
  name.textContent = '第' + SEAL_NUM[SEAL_ORDER.indexOf(k)] + '枚印章 · ' + d.name;
  var body = el('div', 'sealBody');
  body.textContent = d.body;
  var hint = el('div', 'sealHint');
  hint.textContent = replay ? '点击任意处关闭' : TEXTS.ui.sealHint;
  card.appendChild(art); card.appendChild(name); card.appendChild(body); card.appendChild(hint);
  card.addEventListener('click', function (e) {
    e.stopPropagation();
    closeSealCard();
  });
  layer.appendChild(card);
  sealCardEl = card;
  if (sealCardTimer) { clearTimeout(sealCardTimer); }
  sealCardTimer = setTimeout(closeSealCard, 5000);
}
function closeSealCard() {
  if (sealCardTimer) { clearTimeout(sealCardTimer); sealCardTimer = null; }
  if (sealCardEl && sealCardEl.parentNode) { sealCardEl.parentNode.removeChild(sealCardEl); }
  sealCardEl = null;
}

buildSealBar();

/* 结局前：提交三枚印记（三枚齐了才能继续） */
function renderSealSubmit(s) {
  var wrap = el('div', 'sealSubmit');
  var title = el('div', 'sealSubmitTitle');
  title.textContent = '三枚印记';
  wrap.appendChild(title);
  var row = el('div', 'sealSubmitRow');
  SEAL_ORDER.forEach(function (k) {
    var has = !!sealStore[k];
    var cell = el('div', 'sealBig' + (has ? ' on' : ''));
    var nm = el('div', 'sealBigName');
    nm.textContent = has ? TEXTS.seals[k].name : '未得';
    cell.appendChild(nm);
    row.appendChild(cell);
  });
  wrap.appendChild(row);
  var btn = el('div', 'sealSubmitBtn');
  btn.textContent = '提 交';
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var n = 0;
    SEAL_ORDER.forEach(function (k) { if (sealStore[k]) { n++; } });
    if (n < SEAL_ORDER.length) { toast('三枚印记还没齐，回去再看看。'); return; }
    if (typeof SFX !== 'undefined' && SFX && SFX.ding) { SFX.ding(); }
    go(s.next);
  });
  wrap.appendChild(btn);
  layer.appendChild(wrap);
  if (typeof hideText === 'function') { hideText(); }
}

/* 重玩：本轮印章清零，三枚可以重新拿一遍 */
function resetSeals() {
  sealStore = {};
  buildSealBar();
}
