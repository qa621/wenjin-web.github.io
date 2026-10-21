/* 《问津》 —— audio.js
 * 音频模块：全部音效与背景乐由代码现场合成（Web Audio），不依赖任何音频文件
 * SFX.* 是音效，bgmStart() 是背景乐
 */
'use strict';

/* ================= 音频 ================= */
var ctx = null, masterNode = null, muted = false;
function C() {
  if (ctx) { try { if (ctx.state === 'suspended') { ctx.resume(); } } catch (e) {} return ctx; }
  try {
    var W = (typeof window !== 'undefined') ? window : null;
    var AC = W && (W.AudioContext || W.webkitAudioContext);
    if (!AC) { return null; }
    ctx = new AC();
  } catch (e) { ctx = null; }
  return ctx;
}
function out(c) {
  if (!masterNode) {
    masterNode = c.createGain();
    masterNode.gain.value = muted ? 0 : 1;
    masterNode.connect(c.destination);
  }
  return masterNode;
}
function setMuted(m) {
  muted = m;
  if (masterNode) { masterNode.gain.value = m ? 0 : 1; }
  if (soundEl) { soundEl.textContent = m ? '♪ 关' : '♪ 开'; }
}
function noiseBuf(c, secs) {
  var n = Math.max(1, Math.floor(c.sampleRate * secs));
  var b = c.createBuffer(1, n, c.sampleRate);
  var d = b.getChannelData(0);
  for (var i = 0; i < n; i++) { d[i] = Math.random() * 2 - 1; }
  return b;
}
function makeReverb(c, secs, decay) {
  var rate = c.sampleRate, len = Math.max(1, Math.floor(rate * secs));
  var buf = c.createBuffer(2, len, rate);
  for (var ch = 0; ch < 2; ch++) {
    var d = buf.getChannelData(ch);
    for (var i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  }
  var cv = c.createConvolver(); cv.buffer = buf; return cv;
}
var SFX = (function () {
  function burst(o) {
    var c = C(); if (!c) { return; }
    var t = c.currentTime, dur = o.dur || 0.3;
    var src = c.createBufferSource(); src.buffer = noiseBuf(c, dur);
    var f = c.createBiquadFilter(); f.type = o.type || 'bandpass';
    f.frequency.value = o.freq || 1200; f.Q.value = o.q || 1;
    var g = c.createGain();
    var peak = (o.gain == null) ? 0.12 : o.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out(c));
    src.start(t); src.stop(t + dur + 0.05);
  }
  function echoes(o) {
    var reps = o.reps || 3, step = o.step || 180;
    for (var i = 0; i < reps; i++) {
      (function (i) { setTimeout(function () { burst(o); }, i * step); })(i);
    }
  }
  function tone(freq, dur, gain, slideTo, type) {
    var c = C(); if (!c) { return; }
    var t = c.currentTime;
    var osc = c.createOscillator(); osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) { osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur); }
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(out(c));
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  var water = null;
  function waterStart() {
    var c = C(); if (!c || water) { return; }
    var src = c.createBufferSource(); src.buffer = noiseBuf(c, 3); src.loop = true;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 880; f.Q.value = 0.7;
    var g = c.createGain(); g.gain.value = 0.028;
    var lfo = c.createOscillator(); lfo.frequency.value = 0.22;
    var lg = c.createGain(); lg.gain.value = 240;
    lfo.connect(lg); lg.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(out(c));
    src.start(); lfo.start();
    water = { src: src, lfo: lfo };
  }
  function waterStop() {
    if (!water) { return; }
    try { water.src.stop(); water.lfo.stop(); } catch (e) {}
    water = null;
  }
  return {
    rustle:  function (v) { burst({ dur: 0.5, freq: 3400, q: 0.7, gain: (v || 0.085), attack: 0.05 }); },
    collect: function () { tone(880, 0.2, 0.055, 1560); },
    cave:    function () { echoes({ dur: 0.09, freq: 900, q: 1.2, gain: 0.08, reps: 3, step: 210 }); },
    gate:    function () { burst({ dur: 1.3, type: 'lowpass', freq: 190, q: 0.8, gain: 0.26, attack: 0.16 });
                           echoes({ dur: 0.12, freq: 420, q: 1, gain: 0.085, reps: 3, step: 260 }); },
    ignite:  function () { burst({ dur: 0.7, freq: 1100, q: 0.6, gain: 0.17, attack: 0.26 }); },
    crackle: function () { burst({ dur: 0.12, freq: 2600, q: 0.9, gain: 0.04 }); },
    pour: function () {
      burst({ dur: 1.2, type: 'bandpass', freq: 520, q: 0.9, gain: 0.07, attack: 0.4 });
      burst({ dur: 1.0, type: 'bandpass', freq: 1400, q: 1.3, gain: 0.028, attack: 0.5 });
    },
    gulp: function () {
      tone(250, 0.16, 0.055, 150, 'sine');
      burst({ dur: 0.18, type: 'lowpass', freq: 420, q: 0.8, gain: 0.055, attack: 0.01 });
      setTimeout(function () { tone(215, 0.15, 0.05, 140, 'sine'); }, 270);
      setTimeout(function () { tone(190, 0.16, 0.045, 130, 'sine'); }, 520);
    },
    stone:   function () { echoes({ dur: 0.06, freq: 1600, q: 1.5, gain: 0.12, reps: 3, step: 150 }); },
    /* 揉纸声：一串又短又高的噪声，密度和力度可调 */
    crinkle: function (v) {
      var n = 6 + Math.round((v || 1) * 10);
      for (var i = 0; i < n; i++) {
        setTimeout(function () {
          burst({ dur: 0.05 + Math.random() * 0.06, type: 'bandpass',
                  freq: 1800 + Math.random() * 4200, q: 0.8 + Math.random() * 1.6,
                  gain: (0.035 + Math.random() * 0.055) * (v || 1), attack: 0.004 });
        }, Math.random() * 280);
      }
    },
    spark:   function () { burst({ dur: 0.13, freq: 2300, q: 1.6, gain: 0.17 }); tone(1900, 0.09, 0.035, 700); },
    whoosh:  function () { burst({ dur: 1.4, type: 'lowpass', freq: 520, q: 0.7, gain: 0.1, attack: 0.5 }); },
    step:    function (alt) { burst({ dur: 0.17, type: 'lowpass', freq: alt ? 170 : 130, q: 0.6, gain: 0.075, attack: 0.008 }); },
    wood:    function () { tone(300, 0.16, 0.06, 180, 'triangle'); burst({ dur: 0.08, freq: 900, q: 1.4, gain: 0.07 }); },
    wrong:   function () { tone(220, 0.22, 0.05, 150, 'triangle'); },
    /* 点对了：一声清脆的叮 */
    ding:    function () { tone(1180, 0.26, 0.05, 1180, 'sine'); tone(1760, 0.18, 0.03, 1760, 'sine'); },
    waterStart: waterStart, waterStop: waterStop
  };
})();

var PENTA = [523.25, 587.33, 659.25, 783.99, 880.00];
var LOWP  = [130.81, 146.83, 164.81, 196.00];
var BGM = { started: false, g: null, conv: null, timers: [] };
function schedulePluck() {
  BGM.timers.push(setTimeout(function () {
    if (!BGM.started) { return; }
    var c = C();
    if (c) {
      var t = c.currentTime;
      var f = PENTA[Math.floor(Math.random() * PENTA.length)];
      if (Math.random() < 0.35) { f *= 2; }
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.046, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
      o.connect(g); g.connect(BGM.g); g.connect(BGM.conv);
      o.start(t); o.stop(t + 3);
    }
    schedulePluck();
  }, 3000 + Math.random() * 4500));
}
function schedulePad() {
  BGM.timers.push(setTimeout(function () {
    if (!BGM.started) { return; }
    var c = C();
    if (c) {
      var t = c.currentTime, root = LOWP[Math.floor(Math.random() * LOWP.length)];
      [root, root * 1.5, root * 2].forEach(function (f) {
        var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.019, t + 3.5);
        g.gain.linearRampToValueAtTime(0.0001, t + 13);
        o.connect(g); g.connect(BGM.g); g.connect(BGM.conv);
        o.start(t); o.stop(t + 13.5);
      });
    }
    schedulePad();
  }, 13000 + Math.random() * 7000));
}
function bgmStart() {
  var c = C(); if (!c || BGM.started) { return; }
  BGM.started = true;
  var g = c.createGain();
  g.gain.value = 0.0001;
  g.gain.exponentialRampToValueAtTime(0.15, c.currentTime + 6);
  g.connect(out(c)); BGM.g = g;
  var conv = makeReverb(c, 3.2, 2.6);
  var wet = c.createGain(); wet.gain.value = 0.5;
  conv.connect(wet); wet.connect(g); BGM.conv = conv;
  [65.41, 98.00].forEach(function (f, i) {
    var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    var og = c.createGain(); og.gain.value = 0.042;
    var lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05 + i * 0.03;
    var lg = c.createGain(); lg.gain.value = 0.026;
    lfo.connect(lg); lg.connect(og.gain);
    o.connect(og); og.connect(g); og.connect(conv);
    o.start(); lfo.start();
  });
  schedulePluck(); schedulePad();
}
