/* 《问津》 —— act2.js
 * 第二幕 · 山门与洞：石雕圆锁嵌花瓣、摸黑找两块打火石、磨石生火、举火把照出孔洞
 */
'use strict';

var notchSeq = 0;
function fillNotch(n) {
  if (!cur || cur.type !== 'lock') { return; }
  if (popupEl) { return; }
  if (n.classList.contains('filled')) { return; }
  if (petals <= 0) { showPopup((cur && cur.hintLack) || '还缺花瓣。', null); return; }
  n.classList.add('filled');
  handPetal = false; dragEl.classList.remove('hand'); aimNotches(false); holdGlow(false);
  hint('点花瓣→拿起。点凹槽→嵌入。');
  petals--; notchSeq++;
  tip('已嵌入 ' + notchSeq + ' 片，共 ' + needPetals + ' 片。', 2000);
  updateHud(); renderTools(); SFX.collect();
  if (notchSeq >= needPetals) {
    SFX.gate();
    layer.appendChild(el('div', 'opening'));
    lockUntil = Date.now() + 3800;
    /* 门开：镜头继续推进 + 逐渐失焦，然后黑幕，最后进洞 */
    if (bgEl) {
      bgEl.style.transition = 'transform 2.4s ease-in-out, filter 1.4s ease';
      bgEl.style.transform = 'scale(3.2)';
      bgEl.style.filter = 'blur(3px) brightness(.55)';
    }
    setTimeout(function () {
      if (fadeEl) { fadeEl.classList.add('on'); }
    }, 1000);
    setTimeout(function () { go(cur.next); }, 2200);
  }
}
function renderLock(s) {
  notchSeq = 0;
  var lock = el('div'); lock.id = 'lock';
  lock.appendChild(el('div', 'disc'));
  for (var i = 0; i < needPetals; i++) {
    (function (i) {
      var ang = (-90 + i * 72) * Math.PI / 180;
      var n = el('div', 'notch');
      n.style.left = (50 + Math.cos(ang) * 20) + '%';
      n.style.top = (50 + Math.sin(ang) * 20) + '%';
      n.style.transform = 'rotate(' + Math.round(-90 + i * 72) + 'deg)';
      n.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!cur || cur.type !== 'lock' || popupEl) { return; }
        if (n.classList.contains('filled')) { return; }
        if (Date.now() < lockUntil) { return; }
        if (petals <= 0) { tip('花瓣不足。回桃林拾取。', 2400); return; }
        if (!handPetal) {
          pickUpPetal();
          tip('已替你拿起花瓣。再点凹槽，嵌入。', 2600);
          return;
        }
        fillNotch(n);
      });
      lock.appendChild(n);
    })(i);
  }
  layer.appendChild(lock);
  cellsEl.classList.add('pickable');
  tip('点花瓣，拿起花瓣。点凹槽，嵌入花瓣。把花瓣拖到凹槽，也能嵌入。', 6000);
  setTimeout(function () { if (cur === s) { lock.classList.add('show'); } }, 900);
  if (petals < needPetals) { toast(s.hintLack); }
  hideText();
}

function renderFlint(s) {
  if (s.probe) {
    probeEl.style.opacity = '1';
    moveProbe(50, 55);
    stepTimer = setInterval(function () {
      if (!cur || cur.type !== 'flint') { return; }
      stepFoot = 1 - stepFoot; SFX.step(stepFoot);
    }, 1250);
  }
  var miss = el('div');
  miss.style.position = 'absolute'; miss.style.inset = '0'; miss.style.zIndex = '10';
  miss.addEventListener('click', function (e) {
    e.stopPropagation();
    if (popupEl) { return; }
    wrong++;
    if (wrong % 2 === 0) { showPopup(s.hint, null); }
  });
  layer.appendChild(miss);
  var f = el('div', 'flint glint');
  f.style.left = s.pos.x + '%'; f.style.top = s.pos.y + '%';
  f.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!cur || cur.type !== 'flint') { return; }
    flints++; renderTools(); SFX.stone();
    toast(flints >= needFlints ? '两块打火石，都在了' : '拾得 打火石 · 一');
    layer.removeChild(f);
    go(s.next);
  });
  layer.appendChild(f);
  hideText();
}
function moveProbe(x, y) {
  probeEl.style.background =
    'radial-gradient(circle at ' + x + '% ' + y + '%,' +
    ' rgba(0,0,0,0) 0%, rgba(255,236,200,.06) 6%, rgba(0,0,0,.55) 11%, rgba(0,0,0,.94) 28%)';
}

/* 第一视角磨打火石（背景用你给的那张图） */
function renderCombine(s) {
  var wrap = el('div'); wrap.id = 'hands';
  var inner = el('div', 'wrap');
  inner.appendChild(el('div', 'shade'));
  var tip = el('div', 'tip'); tip.textContent = '点击，磨打火石';
  inner.appendChild(tip);
  wrap.appendChild(inner);
  var strikes = 0;
  wrap.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!cur || cur.type !== 'combine') { return; }
    strikes++;
    SFX.spark();
    for (var k = 0; k < 8; k++) {
      (function (k) {
        var sp = el('div', 'spark');
        sp.style.left = (46 + Math.random() * 12) + '%';
        sp.style.top = (58 + Math.random() * 18) + '%';
        sp.style.animationDelay = (k * 16) + 'ms';
        inner.appendChild(sp);
        setTimeout(function () { if (sp.parentNode) { sp.parentNode.removeChild(sp); } }, 900);
      })(k);
    }
    if (strikes >= 3) {
      torchLit = true;
      torchGot = true;
      var fll = el('div'); fll.id = 'flash';
      fxEl.appendChild(fll);
      setTimeout(function () { fll.style.opacity = '1'; }, 40);
      SFX.ignite();
      lockUntil = Date.now() + 2600;
      setTimeout(function () { if (fll.parentNode) { fll.parentNode.removeChild(fll); } go(s.next); }, 2400);
    }
  });
  layer.appendChild(wrap);
  hideText();
}

var HOLE_POS = [
  { x:14, y:58 }, { x:30, y:72 }, { x:47, y:36 }, { x:63, y:20 },
  { x:76, y:54 }, { x:41, y:76 }, { x:59, y:64 }
];
var HOLE_ORDER = [2, 4, 6];
var HOLE_LV = { 2: 'lv3', 4: 'lv2', 6: 'lv1' };
function renderTorchHunt(s) {
  darkEl.style.opacity = '1';
  if (!handTorch) {
    handTorch = el('div'); handTorch.id = 'handtorch';
    fxEl.appendChild(handTorch);
  }
  handTorch.classList.add('show');
  var holes = [], pos = [], lit = [], step = 0, fails = 0, started = false;
  HOLE_POS.forEach(function (p, i) {
    var h = el('img', 'hole' + (HOLE_LV[i] ? (' real ' + HOLE_LV[i]) : ''));
    h.src = img('hole-off');
    h.style.left = p.x + '%'; h.style.top = p.y + '%'; h.style.width = '10%';
    pos.push({ x: p.x + 5, y: p.y + 8 });
    h.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!cur || cur.type !== 'torchhunt') { return; }
      if (popupEl || h.classList.contains('on')) { return; }
      if (!started) { started = true; showPopup('这些孔里，有的透光，有的只是石窝。', null); return; }
      if (HOLE_ORDER.indexOf(i) < 0) { fails++; SFX.wrong(); showPopup('那不是孔，是石窝。', null); return; }
      if (HOLE_ORDER[step] !== i) {
        fails++;
        lit.forEach(function (k) { holes[k].classList.remove('on'); holes[k].src = img('hole-off'); });
        lit = []; step = 0; SFX.wrong();
        showPopup(fails >= 2 ? '越亮的孔，越先点亮。' : '光乱了。', null);
        return;
      }
      h.classList.add('on'); h.src = img('hole-on');
      lit.push(i); step++; SFX.crackle();
      if (step >= HOLE_ORDER.length) { go(s.next); }
    });
    holes.push(h);
    layer.appendChild(h);
  });
  holeSet = { holes: holes, pos: pos };
  moveLight(50, 48);
  hideText();
}
function moveLight(x, y) {
  lightX = x; lightY = y;
  darkEl.style.background =
    'radial-gradient(circle at ' + x + '% ' + y + '%,' +
    ' rgba(0,0,0,0) 0%, rgba(0,0,0,.26) 9%, rgba(0,0,0,.84) 26%, rgba(0,0,0,.95) 46%)';
  if (handTorch) {
    handTorch.style.left = x + '%'; handTorch.style.top = y + '%';
    var flip = (x < lastLX - 0.4) ? -1 : (x > lastLX + 0.4 ? 1 : null);
    if (flip) {
      handTorch.style.transform = 'translate(-50%,-58%) scaleX(' + flip + ')';
      lastLX = x;
    }
  }
  if (holeSet && holeSet.holes) {
    for (var i = 0; i < holeSet.holes.length; i++) {
      var p = holeSet.pos[i];
      var d = Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y));
      var o = d < 13 ? Math.min(1, Math.max(0, 1 - d / 13) * 1.4) : 0;
      if (!holeSet.holes[i].classList.contains('on')) { holeSet.holes[i].style.opacity = o.toFixed(2); }
    }
  }
}

/* 白天石缝：点石锁进入解谜，点别处给提示（不推进） */
function renderGateDay(s) {
  showText(s.text);
  var miss = el('div');
  miss.style.position = 'absolute'; miss.style.inset = '0'; miss.style.zIndex = '9';
  miss.addEventListener('click', function (e) {
    e.stopPropagation();
    toast(s.hint || '石锁紧锁，需要五片花瓣。');
  });
  layer.appendChild(miss);
  var hot = el('div', 'hotspot lockhot');
  hot.style.left = '43%'; hot.style.top = '30%'; hot.style.width = '20%'; hot.style.height = '36%';
  hot.addEventListener('click', function (e) { e.stopPropagation(); go(s.next); });
  layer.appendChild(hot);
}
