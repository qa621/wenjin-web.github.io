/* 《问津》 —— main.js
 * 主控模块：go() 场景调度、全局点击与指针事件、开场动画与游戏启动
 * 最后加载
 */
'use strict';

/* ================= 渲染 ================= */
function go(id) {
  var s = S[id];
  if (!s) { return; }
  var prevId = curId;
  curId = id;
  if (id === 'intro1') { marks = 0; petals = 0; flints = 0; torchLit = false; sawOld = false; torchGot = false; }
  /* 从结局回到开头（重玩）：本轮印章清零，能再拿一次；首次打开仍读存档 */
  if (id === 'intro1' && typeof resetSeals === 'function') { resetSeals(); }
  updateHud(); renderTools();
  clearPetals(); clearLayer(); hideText(); endDrag(); clearTip();
  cellsEl.classList.remove('pickable');
  glowEl.style.opacity = '0';
  darkEl.style.opacity = '0';
  probeEl.style.opacity = '0';
  if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
  if (handTorch) { handTorch.classList.remove('show'); }
  holeSet = null;
  cur = s; wrong = 0;

  if (s.bg) { bgEl.style.backgroundImage = "url('assets/" + s.bg + ".jpg')"; }
  if (s.black) { bgEl.style.backgroundImage = 'none'; }
  bgEl.style.backgroundSize = 'cover';
  bgEl.style.backgroundPosition = 'center';
  bgEl.style.filter = '';
  if (fadeEl) { fadeEl.classList.remove('on'); }
  /* 三枚印章：一幕一枚——出门入洞、豁然开朗、留志将别（即便印章出错，也不能影响画面） */
  try {
    if (id === 'aSign') { awardSeal('rujin'); }
    else if (id === 'bSign') { awardSeal('minfeng'); }
    else if (id === 'cSign') { awardSeal('guixin'); }
  } catch (err) { /* 忽略：印章失败不应阻断场景 */ }
  /* 结局存档 + 标题页的回顾入口 */
  if (id === 'endA1') { endingSave('A'); }
  if (id === 'endB1') { endingSave('B'); }
  if (typeof setReviewButton === 'function') { setReviewButton(id === 'intro1'); }
  /* 结局屏的特殊排版（避免浅底白框发白） */
  if (/^end[AB]/.test(id)) { stage.classList.add('ending'); } else { stage.classList.remove('ending'); }
  /* 石洞：火把未点亮时整体压暗，暖光只留在火把周围 */
  var isCave = s.bg === 'bg-cave';
  if (isCave && !torchLit) { stage.classList.add('cave-dim'); } else { stage.classList.remove('cave-dim'); }
  if (warmEl) {
    var holdLight = isCave && torchLit && s.type !== 'torchhunt';
    if (holdLight) { warmEl.classList.add('on'); } else { warmEl.classList.remove('on'); }
  }

  var zf = (typeof s.zoomFrom === 'number') ? s.zoomFrom : 1;
  var zt = (typeof s.zoomTo === 'number') ? s.zoomTo : 1;
  bgEl.style.transition = 'none';
  bgEl.style.transform = 'scale(' + zf + ')';
  try { void bgEl.offsetWidth; } catch (e) {}
  bgEl.style.transition = 'transform ' + (s.zoomMs || 1600) + 'ms ease-out, opacity 1.1s ease';
  bgEl.style.transform = 'scale(' + zt + ')';

  if (s.reveal) {
    veilEl.style.transition = 'opacity 4.2s ease';
    veilEl.style.opacity = '1';
    var bl = el('div');
    bl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:19;' +
      'background:radial-gradient(circle at 50% 50%, rgba(255,251,236,.98), rgba(255,229,176,.62) 42%, rgba(255,205,130,0) 80%);' +
      'transition:opacity 4.6s ease;opacity:1;';
    fxEl.appendChild(bl);
    setTimeout(function () { bl.style.opacity = '0'; }, 1200);
    setTimeout(function () { if (bl.parentNode) { bl.parentNode.removeChild(bl); } }, 6200);
    setTimeout(function () { if (cur === s) { veilEl.style.opacity = '0'; } }, 700);
    SFX.whoosh();
  } else if (s.fadeIn) {
    veilEl.style.transition = 'none';
    veilEl.style.opacity = '1';
    void veilEl.offsetWidth;
    veilEl.style.transition = 'opacity ' + (id === 'b1' ? '5s' : '3.4s') + ' ease';
    setTimeout(function () { if (cur === s) { veilEl.style.opacity = '0'; } }, 60);
  } else {
    veilEl.style.transition = 'opacity 1.1s ease';
    veilEl.style.opacity = (typeof s.veil === 'number') ? String(s.veil) : '0';
  }
  fogEl.style.opacity = s.fog ? String(s.fog) : '0';
  if (id.charAt(0) !== 'a') { SFX.waterStop(); }
  if (s.echo) { SFX.cave(); }
  showHud(s.type === 'petals' || s.type === 'lock');
  showTools(!!s.tools);
  clearTip();
  if (id === 'intro1') { boxEl.classList.add('slow'); } else { boxEl.classList.remove('slow'); }

  if (s.type === 'buttons')   { renderButtons(s);   return; }
  if (s.type === 'explore')   { renderExplore(s);   return; }
  if (s.type === 'petals')    { renderPetals(s);    return; }
  if (s.type === 'leaves')    { renderLeaves(s);    return; }
  if (s.type === 'lock')      { renderLock(s);      return; }
  if (s.type === 'flint')     { renderFlint(s);     return; }
  if (s.type === 'combine')   { renderCombine(s);   return; }
  if (s.type === 'torchhunt') { renderTorchHunt(s); return; }
  if (s.type === 'marks')     { renderMarks(s);     return; }
  if (s.type === 'sealSubmit') { renderSealSubmit(s); return; }
  if (s.type === 'gateDay')  { renderGateDay(s);  return; }
  if (s.type === 'sign')      { renderSign(s);      return; }
  if (s.type === 'era')       { renderEra(s);       return; }
  if (s.type === 'feast')     { renderFeast(s);     return; }
  if (s.type === 'oldmarks')  { renderOldMarks(s);  return; }
  if (s.type === 'forks')     { renderForks(s);     return; }

  var t = s.text || '';
  if (id === 'endA1' && sawOld) { t = '你什么也没有说。\n你想起墙上那三枚印：先人携种入山，不是逃，是保。\n你替他们，守住了最后一口气。'; }
  if (id === 'endB1' && sawOld) { t = '他们含泪送你到村口：「去吧，让外面的人知道，还有一处地方是亮的。」\n你想起墙上那三枚印。'; }
  showText(t);
}

/* ================= 全局交互 ================= */
stage.addEventListener('click', function (e) {
  try {
    if (!e || e.clientX == null || !stage.getBoundingClientRect) { return; }
    var r = stage.getBoundingClientRect();
    if (!r || !r.width) { return; }
    ripple(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  } catch (err) {}
  if (!BGM.started) { bgmStart(); }
}, true);

function where(e) {
  if (!e || e.clientX == null || !stage.getBoundingClientRect) { return null; }
  var r = stage.getBoundingClientRect();
  if (!r || !r.width) { return null; }
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
}
function trackPointer(e) {
  if (!cur) { return; }
  var w = where(e);
  if (!w) { return; }
  if (cur.type === 'torchhunt') { moveLight(w.x, w.y); }
  else if (cur.type === 'flint' && cur.probe) { moveProbe(w.x, w.y); }
}
stage.addEventListener('mousemove', trackPointer);
stage.addEventListener('touchmove', function (e) {
  if (e && e.touches && e.touches.length) { trackPointer(e.touches[0]); }
});

if (soundEl) {
  soundEl.addEventListener('click', function (e) { e.stopPropagation(); setMuted(!muted); });
  soundEl.textContent = '♪ 开';
}
if (toolToggle) {
  toolToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setToolsPulled(!toolsEl.classList.contains('pulled'));
  });
  toolToggle.textContent = '收起';
}

/* 全局：点任意处关闭弹窗 / 印章卡（捕获阶段，先于任何谜题层的 stopPropagation） */
if (document && document.addEventListener) {
  document.addEventListener('click', function (e) {
    if (popupEl) { e.stopPropagation(); e.preventDefault(); closePopup(); return; }
    if (typeof sealCardEl !== 'undefined' && sealCardEl) {
      e.stopPropagation(); e.preventDefault(); closeSealCard();
    }
  }, true);
}

stage.addEventListener('click', function (e) {
  var now = Date.now();
  /* 印章说明卡优先关闭 */
  if (typeof sealCardEl !== 'undefined' && sealCardEl) { closeSealCard(); return; }
  /* 任意处点击都能关闭当前对话；一句只关一次，下一句由 onClose 自动接上 */
  if (popupEl) { closePopup(); return; }
  var w = where(e);
  var tgt = e && e.target && e.target.closest
    ? e.target.closest('.hotspot,.notch,.flint,.cavetorch,.eraT,.path,.feast,.hole,.mark,.cell')
    : null;
  if (tgt && w) { ripple(w.x, w.y); sparkle(w.x, w.y); }
  if (now < lockUntil) { return; }
  if (!cur) { return; }
  switch (cur.type) {
    case 'explore': case 'leaves': case 'lock': case 'flint':
    case 'combine': case 'torchhunt': case 'marks': case 'buttons': case 'petals':
    case 'sealSubmit':
    case 'era': case 'feast': case 'oldmarks': case 'forks':
      return;
    case 'sign':
      lockUntil = now + 350; go(cur.next); return;
    default:
      if (cur.next) { lockUntil = now + 350; go(cur.next); }
  }
});

/* 开场先放动画，动画结束才进标题 */
if (filmEl) {
  filmFrame(1);
  if (filmStart) { filmStart.classList.remove('hide'); }
  if (filmSkip) { filmSkip.classList.add('hide'); }
} else {
  go('intro1');
}
