/* 《问津》 —— film.js
 * 开场动画：深夜书桌 → 揉成纸团 → 迸裂成桃花瓣雨 → 桃花酿问答
 * 视觉时序全部由 animation.css 的 .play 类驱动，本文件只做事件响应与花瓣粒子
 */
'use strict';

/* ================= 开场动画：深夜书桌 → 揉成纸团 ================= */
var filmEl = document.getElementById('film');
var filmBall = document.getElementById('filmBall');
var filmGlowEl = document.getElementById('filmGlow');
var filmCrackEl = document.getElementById('filmCrack');
var filmFlashEl = document.getElementById('filmFlash');
var filmTapEl = document.getElementById('filmTap');
var filmGroveEl = document.getElementById('filmGrove');
var filmGoldEl = document.getElementById('filmGold');
var filmBottleEl = document.getElementById('filmBottle');
var filmNarrEl = document.getElementById('filmNarr');
var filmStart = document.getElementById('filmStart');
var filmSkip = document.getElementById('filmSkip');
var filmTimers = [], filmStarted = false, filmDone = false;

/* ---------- 花瓣粒子（canvas 逐片渲染）：数百片、变风、逐片旋转、消散留光粒 ---------- */
var filmCanvas = document.getElementById('filmCanvas');
var fctx = (filmCanvas && filmCanvas.getContext) ? filmCanvas.getContext('2d') : null;
var CW = 1400, CH = 788, CCX = 700, CCY = 394;
var petalSprite = null, parts = [], grains = [];
var filmRaf = 0, filmLast = 0, camT0 = 0, camScale = 1.8;

function buildPetalSprite() {
  if (!fctx || petalSprite) { return; }
  try {
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = 72; c.height = 72;
        var g = c.getContext('2d');
        g.drawImage(img, 0, 0, 72, 72);
        g.globalCompositeOperation = 'source-atop';
        var rg = g.createRadialGradient(31, 31, 3, 36, 36, 38);
        rg.addColorStop(0, 'rgba(255,212,224,0.96)');      /* 中心暖粉 */
        rg.addColorStop(0.58, 'rgba(255,226,235,0.58)');
        rg.addColorStop(1, 'rgba(255,241,246,0.06)');      /* 边缘淡透明 */
        g.fillStyle = rg; g.fillRect(0, 0, 72, 72);
        petalSprite = c;
      } catch (e) { petalSprite = null; }
    };
    img.src = 'assets/film-petal.png';
  } catch (e) { petalSprite = null; }
}

function burstPetals(n) {
  if (!fctx) { return; }
  buildPetalSprite();
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2;
    var sp = 130 + Math.random() * 540;                    /* 初始速度高、方向随机 */
    parts.push({
      x: CCX + (Math.random() - 0.5) * 30,
      y: CCY + (Math.random() - 0.5) * 30,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.82,
      rot: Math.random() * Math.PI * 2,
      av: (Math.random() * 45 - 22) * Math.PI / 180,        /* 逐片旋转 0–45 度/秒 */
      sc: 0.42 + Math.random() * 0.68,
      age: 0,
      life: 2.0 + Math.random() * 1.0                       /* 2–3 秒后消散 */
    });
  }
  camT0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  camScale = 1.8;
  if (!filmRaf && typeof requestAnimationFrame === 'function') {
    filmLast = 0;
    filmRaf = requestAnimationFrame(filmTick);
  }
}

function filmTick(now) {
  if (!fctx) { filmRaf = 0; return; }
  if (!filmLast) { filmLast = now; }
  var dt = Math.min(0.05, (now - filmLast) / 1000);
  filmLast = now;

  /* 镜头从纸团特写平滑推远到全景 */
  if (camT0) {
    var t = Math.min(1, (now - camT0) / 4200);
    camScale = 1.8 + (1.0 - 1.8) * (1 - Math.pow(1 - t, 3));
  }

  /* 柔和三维风场：风力中等，风向随机摆动 */
  var windX = Math.sin(now / 1700) * 52 + Math.sin(now / 610) * 20;
  var windY = Math.cos(now / 1300) * 22 + 10;

  fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.clearRect(0, 0, CW, CH);
  fctx.translate(CCX, CCY); fctx.scale(camScale, camScale); fctx.translate(-CCX, -CCY);

  if (petalSprite) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.age += dt;
      /* 风阻：速度逐渐趋近风向，于是轨迹自然弯曲，不是直线，也没有机械感 */
      p.vx += (windX - p.vx * 0.85) * dt;
      p.vy += (windY - p.vy * 0.85 + 48) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.av * dt;
      var k = 1 - p.age / p.life;
      if (k <= 0) {
        grains.push({ x: p.x, y: p.y, r: 0.9 + Math.random() * 2.2, age: 0, life: 0.9 + Math.random() * 0.9 });
        grains.push({ x: p.x + (Math.random() - 0.5) * 14, y: p.y + (Math.random() - 0.5) * 14, r: 0.8 + Math.random() * 1.6, age: 0, life: 0.8 + Math.random() * 0.8 });
        parts.splice(i, 1);
        continue;
      }
      fctx.globalAlpha = 0.8 * k;                            /* 从 80% 逐渐衰减到消散 */
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.scale(p.sc, p.sc);
      fctx.drawImage(petalSprite, -36, -36);
      fctx.restore();
    }
  }
  fctx.globalAlpha = 1;
  for (var j = grains.length - 1; j >= 0; j--) {
    var q = grains[j];
    q.age += dt;
    var kk = 1 - q.age / q.life;
    if (kk <= 0) { grains.splice(j, 1); continue; }
    fctx.globalAlpha = 0.85 * kk;
    fctx.fillStyle = 'rgba(255,236,186,1)';
    fctx.beginPath();
    fctx.arc(q.x, q.y, q.r * (1 + (1 - kk) * 0.6), 0, Math.PI * 2);
    fctx.fill();
  }
  fctx.globalAlpha = 1;
  if (parts.length || grains.length) {
    filmRaf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame(filmTick) : 0;
  } else { filmRaf = 0; }
}

function clearFilmPetals() {
  parts = []; grains = [];
  if (fctx) { try { fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, CW, CH); } catch (e) {} }
}

function filmLater(ms, fn) { filmTimers.push(setTimeout(fn, ms)); }
function filmNarr(t) {
  if (!filmNarrEl) { return; }
  filmNarrEl.textContent = t;
  filmNarrEl.classList.add('on');
}
function filmNarrHide() { if (filmNarrEl) { filmNarrEl.classList.remove('on'); } }

/* 花瓣散尽之后的对话：靠点击一句一句推进 */
var FILM_TALK = [
  '你是否也曾想过，逃离此刻的喧嚣？',
  '作业、考试、未来的迷茫……',
  '也许，每个人心里都藏着一个桃花源。',
  '这一次，让我们替你走进去看看。'
];
var filmTalkIdx = 0, filmPhase = 'play';
function filmAdvance() {
  if (filmTalkIdx >= FILM_TALK.length) { filmEnd(); return; }
  filmNarr(FILM_TALK[filmTalkIdx]);
  if (filmTalkIdx === 3) {
    if (filmGoldEl) { filmGoldEl.classList.add('on'); }
    if (filmGroveEl) { filmGroveEl.classList.add('on'); }
    SFX.whoosh();
  }
  filmTalkIdx++;
}
function filmFrame(n) {
  for (var i = 1; i <= 5; i++) {
    var e2 = document.getElementById('f' + i);
    if (!e2) { continue; }
    if (i === n) { e2.classList.add('on'); } else { e2.classList.remove('on'); }
  }
}
function filmPlay() {
  if (filmStarted || filmDone) { return; }
  filmStarted = true;
  if (filmEl) { filmEl.classList.add('playing'); }   /* 供自检/调试判断动画已开始 */
  filmTalkIdx = 0; filmPhase = 'play';
  if (filmNarrEl) { filmNarrEl.classList.remove('dark'); }
  if (filmTapEl) { filmTapEl.classList.remove('dark'); }
  if (filmStart) { filmStart.classList.add('hide'); }
  if (filmSkip) { filmSkip.classList.remove('hide'); }
  var f1 = document.getElementById('f1');
  if (f1) { f1.classList.remove('on'); try { void f1.offsetWidth; } catch (e) {} }
  filmFrame(1);
  filmNarr('凌晨两点。屋里只剩台灯还亮着。');
  filmLater(380,  function () { filmFrame(2); SFX.crinkle(0.55); });
  filmLater(760,  function () { filmFrame(3); SFX.crinkle(0.70); });
  filmLater(1140, function () { filmFrame(4); SFX.crinkle(0.85); });
  filmLater(1520, function () { filmFrame(5); SFX.crinkle(1.00); });
  filmLater(1850, function () { filmNarr('任务、账单、明天要交的东西，堆在桌上。'); });
  filmLater(2000, function () {
    for (var i = 1; i <= 5; i++) { var e3 = document.getElementById('f' + i); if (e3) { e3.classList.remove('on'); } }
    if (filmBall) { filmBall.classList.add('in'); }
    SFX.crinkle(1.15);
  });
  filmLater(2700, function () { filmNarr('你把一天揉成一团，塞进胸口。'); });
  filmLater(3300, function () { filmNarr('你有点撑不住了。'); });
  /* 纸团颤动，折痕透出光 */
  filmLater(3900, function () {
    if (filmBall) { filmBall.classList.add('tremble'); }
    if (filmGlowEl) { filmGlowEl.classList.add('in'); }
    SFX.crinkle(0.5);
  });
  /* 光到最亮，纸团从中心向外裂开 */
  filmLater(4500, function () {
    filmNarrHide();
    if (filmBall) { filmBall.classList.remove('tremble'); }
    if (filmGlowEl) { filmGlowEl.classList.remove('in'); }
    if (filmCrackEl) { filmCrackEl.classList.add('in'); }
    if (filmFlashEl) { filmFlashEl.classList.add('on'); }
    SFX.crinkle(1.3);
    SFX.whoosh();
  });
  /* 整只纸团化为数百片桃花瓣，随风飘散 */
  filmLater(4900, function () {
    if (filmBall) { filmBall.classList.add('gone'); }
    if (filmCrackEl) { filmCrackEl.classList.remove('in'); }
    if (filmGoldEl) { filmGoldEl.classList.add('on'); }
    burstPetals(340);
    SFX.crinkle(1.2);
    SFX.whoosh();
  });
  filmLater(6200, function () { if (filmFlashEl) { filmFlashEl.classList.remove('on'); } });
  /* 花瓣散尽，画面沉回黑暗；这里浮出桃花酿，之后全部靠点击推进 */
  filmLater(9600, function () {
    if (filmBottleEl) { filmBottleEl.classList.add('on'); }
    if (filmTapEl) { filmTapEl.classList.add('on'); filmTapEl.classList.add('dark'); }
    if (filmNarrEl) { filmNarrEl.classList.add('dark'); }
    filmPhase = 'ask';
    filmAdvance();
    SFX.pour();
  });
}
function filmEnd() {
  if (filmDone) { return; }
  filmDone = true;
  for (var i = 0; i < filmTimers.length; i++) { clearTimeout(filmTimers[i]); }
  filmTimers = [];
  clearFilmPetals();
  if (filmEl) {
    filmEl.classList.add('out');
    setTimeout(function () {
      filmEl.classList.add('gone');
      go('intro1');
    }, 1240);
  } else {
    go('intro1');
  }
}
if (filmEl) {
  filmEl.addEventListener('click', function (e) {
    if (e && e.stopPropagation) { e.stopPropagation(); }
    if (filmDone) { return; }
    if (!filmStarted) { filmPlay(); return; }
    if (filmPhase === 'ask') { filmAdvance(); }
  });
}
if (filmSkip) {
  filmSkip.addEventListener('click', function (e) {
    if (e && e.stopPropagation) { e.stopPropagation(); }
    filmEnd();
  });
}
