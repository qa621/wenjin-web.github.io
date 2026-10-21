/* 《问津》 —— core.js
 * 核心模块：DOM 引用、共享状态、51 屏的屏幕表 S、通用工具（建元素/提示/弹窗/遍历）
 * 其它模块都依赖它，最先加载
 */
'use strict';

/* 《问津》v7 —— 桃花源点触解谜（纯网页，无依赖；音效与背景乐均为程序合成） */
var stage   = document.getElementById('stage');
var bgEl    = document.getElementById('bg');
var veilEl  = document.getElementById('veil');
var glowEl  = document.getElementById('glow');
var fogEl   = document.getElementById('fog');
var probeEl = document.getElementById('probe');
var darkEl  = document.getElementById('dark');
var layer   = document.getElementById('layer');
var fxEl    = document.getElementById('fx');
var boxEl   = document.getElementById('textbox');
var warmEl  = document.getElementById('warm');
var fadeEl  = document.getElementById('fade');
var textEl  = document.getElementById('text');
var contEl  = document.getElementById('cont');
var petalHud= document.getElementById('petalHud');
var toolsEl = document.getElementById('tools');
var cellsEl = document.getElementById('cells');
var soundEl = document.getElementById('sound');
var dragEl  = document.getElementById('drag');
var toolToggle = document.getElementById('toolToggle');

var marks = 0, petals = 0, flints = 0, torchLit = false, sawOld = false, torchGot = false;
var needPetals = 5, needFlints = 2;
var cur = null, curId = null, lockUntil = 0, contTimer = null;
var fallTimer = null, rustleTimer = null, stepTimer = null;
var popupEl = null, wrong = 0, leavesLeft = 0;
var petalNodes = [], stepFoot = 0;
var handTorch = null, holeSet = null;
var dragActive = false, handPetal = false, lightX = 50, lightY = 52, lastLX = 50;

/* ================= 工具 ================= */
function el(tag, cls) { var d = document.createElement(tag); if (cls) { d.className = cls; } return d; }
/* 浏览器的 children 是 HTMLCollection，没有 forEach，只能用下标遍历；
   eachDeep 连子元素的子元素一起走（比如嵌在 #lock 里的凹槽） */
function eachChild(node, fn) {
  for (var i = 0; i < node.children.length; i++) { fn(node.children[i]); }
}
function eachDeep(node, fn) {
  for (var i = 0; i < node.children.length; i++) {
    var c = node.children[i];
    fn(c);
    eachDeep(c, fn);
  }
}
function img(n) { return 'assets/' + n + '.png'; }
function clearLayer() { while (layer.firstChild) { layer.removeChild(layer.firstChild); } popupEl = null; }
function updateHud() { petalHud.textContent = '花瓣 ' + petals + '/' + needPetals; }
function showHud(on) { if (on) { petalHud.classList.remove('hide'); } else { petalHud.classList.add('hide'); } }
function showTools(on) {
  if (on) { toolsEl.classList.add('show'); setToolsPulled(false); }
  else { toolsEl.classList.remove('show'); }
  if (toolToggle) {
    if (on) { toolToggle.classList.add('show'); } else { toolToggle.classList.remove('show'); }
  }
}
function setToolsPulled(p) {
  if (p) { toolsEl.classList.add('pulled'); } else { toolsEl.classList.remove('pulled'); }
  if (toolToggle) { toolToggle.textContent = p ? '道具' : '收起'; }
}
function showText(t) {
  textEl.textContent = t;
  boxEl.classList.remove('hidden');
  contEl.classList.remove('show');
  if (contTimer) { clearTimeout(contTimer); contTimer = null; }
  contTimer = setTimeout(function () { contEl.classList.add('show'); }, 1200);
  lockUntil = Date.now() + 400;
}
function hideText() {
  boxEl.classList.add('hidden');
  if (contTimer) { clearTimeout(contTimer); contTimer = null; }
}
function showPopup(text, onClose) {
  if (popupEl) { return; }
  var p = el('div'); p.id = 'popup';
  var para = el('p'); para.textContent = text;
  var sp = el('span'); sp.textContent = '点击任意处继续';
  p.appendChild(para); p.appendChild(sp);
  p.addEventListener('click', function (e) {
    e.stopPropagation();
    closePopup();
  });
  layer.appendChild(p); popupEl = p;
  popupEl._onClose = onClose || null;
}
function closePopup() {
  if (!popupEl) { return false; }
  var cb = popupEl._onClose;
  if (popupEl.parentNode) { popupEl.parentNode.removeChild(popupEl); }
  popupEl = null;
  if (cb) { cb(); }
  return true;
}
function toast(text) {
  var t = el('div', 'toast'); t.textContent = text;
  layer.appendChild(t);
  setTimeout(function () { if (t.parentNode) { t.parentNode.removeChild(t); } }, 1500);
}
function label(text) {
  var t = el('div', 'toast'); t.textContent = text;
  layer.appendChild(t); return t;
}
function ripple(xPct, yPct) {
  var r = el('div', 'ripple');
  r.style.left = xPct + '%'; r.style.top = yPct + '%';
  fxEl.appendChild(r);
  setTimeout(function () { if (r.parentNode) { r.parentNode.removeChild(r); } }, 700);
}
/* 点击反馈：几点金色粒子散开（轻，不抢戒） */
function sparkle(xPct, yPct) {
  var offs = [[-1.6, -1.2], [1.5, -1.5], [1.9, 0.8], [-1.3, 1.4], [0.2, -2.3]];
  for (var i = 0; i < offs.length; i++) {
    var s = el('div', 'spark');
    s.style.left = (xPct + offs[i][0]) + '%';
    s.style.top = (yPct + offs[i][1]) + '%';
    s.style.animationDelay = (i * 25) + 'ms';
    fxEl.appendChild(s);
    (function (node) {
      setTimeout(function () { if (node.parentNode) { node.parentNode.removeChild(node); } }, 900);
    })(s);
  }
}
/* 五个花瓣槽：角度与大小各不相同 */
var tipEl = null, tipTimer = null;
function tip(text, ms) {
  if (!tipEl) { tipEl = el('div'); tipEl.id = 'locktip'; fxEl.appendChild(tipEl); }
  tipEl.textContent = text;
  tipEl.style.opacity = '1';
  if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
  if (ms) { tipTimer = setTimeout(function () { if (tipEl) { tipEl.style.opacity = '0'; } }, ms); }
}
function clearTip() {
  if (tipEl && tipEl.parentNode) { tipEl.parentNode.removeChild(tipEl); }
  tipEl = null;
}
/* ================= 屏表 ================= */
var S = {
  intro1: { bg:'bg-title', text:'晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。', next:'intro2',
            fog:1, zoomFrom:1.10, zoomTo:1.0, zoomMs:9000 },
  intro2: { bg:'bg-title', text:'你记不清走了多久。', next:'intro3', fog:1 },
  intro3: { bg:'bg-title', text:'回头，来路已经不见了。', next:'intro4', fog:1 },
  intro4: { bg:'bg-title', type:'buttons', fog:1, buttons:[{label:'入 桃 源', go:'a1'}] },

  a1: { bg:'bg-forest', text:'忽逢桃花林，夹岸数百步，中无杂树。芳草鲜美，落英缤纷。', next:'a2', fadeIn:true },
  a2: { bg:'bg-forest', type:'explore', next:'a3', items:{
          branch: { x:9,  y:14, w:26, h:30, burst:true, text:'中无杂树，枝上尽是桃花。\n——溪水，还在上面。' },
          stream: { x:38, y:66, w:30, h:22, water:true, text:'林尽水源——这条溪，还要往上走。' },
          pile:   { x:70, y:62, w:26, h:24, optional:true, text:'落英缤纷，铺了满地。' }
        } },
  a3: { bg:'bg-forest', text:'可是……有什么，不太对。', next:'a4' },
  a4: { bg:'bg-forest', type:'petals', next:'a5', tools:true },
  a5: { bg:'bg-forest', type:'leaves', count:3, next:'a6', tools:true,
        hint:'再仔细看看。这里的一切，都该是桃花。' },
  a6: { bg:'bg-forest', text:'中无杂树。', next:'a7', tools:true },
  a7: { bg:'bg-forest', text:'可你……是桃花吗？', next:'aSign', tools:true },
  aSign: { bg:'bg-forest', type:'sign', text:'要不要留下点什么？', next:'a8', tools:true },
  a8: { bg:'bg-forest', text:'林尽水源，便得一山。', next:'b1', tools:true },

  b1: { bg:'bg-lock', type:'gateDay', next:'b2', tools:true, fadeIn:true,
        text:'山有小口，仿佛若有光。可门，是封着的。',
        hint:'石锁紧锁，需要五片花瓣。' },

  b2: { bg:null, black:true, type:'lock', next:'b2b', tools:true,
        zoomFrom:1.0, zoomTo:1.45, zoomMs:1400, hintLack:'还缺花瓣——回桃林去捡。' },
  /* 夜里，同一道石缝：门缓缓打开 */
  b2b: { bg:'bg-gate', text:'石门震了一下，缓缓向内开了。\n夜里，有风从里面出来。', next:'b3', veil:0.32, tools:true,
        zoomFrom:1.0, zoomTo:3.0, zoomMs:2600 },
  b3: { bg:'bg-cave', text:'门开了。里面很黑。', next:'b4', veil:0.55, echo:true, tools:true,
        zoomFrom:1.5, zoomTo:1.0, zoomMs:2000 },
  b4: { bg:'bg-cave', type:'flint', next:'b5', veil:0.5, tools:true, probe:true, pos:{x:74,y:70},
        hint:'洞里暗得很。东摸摸，西摸摸。' },
  b5: { bg:'bg-cave', type:'flint', next:'b6', veil:0.5, tools:true, probe:true, pos:{x:22,y:76},
        hint:'再往另一头摸摸看。' },
  b6: { bg:'bg-cave', type:'combine', next:'b7', veil:0.62, tools:true },
  b7: { bg:'bg-cave', type:'torchhunt', next:'b8', tools:true, dark:true },
  b8: { bg:'bg-cave', text:'便舍船，从口入。', next:'b9', veil:1, tools:true },
  b9: { bg:'bg-cave', text:'初极狭，才通人。', next:'b10', veil:0.86 },
  b10: { bg:'bg-village', text:'复行数十步，豁然开朗。', next:'b11', veil:1,
         reveal:true, zoomFrom:1.36, zoomTo:1.0, zoomMs:6000 },
  b11: { bg:'bg-village', text:'土地平旷，屋舍俨然，有良田美池桑竹之属。阡陌交通，鸡犬相闻。', next:'v1' },

  v1: { bg:'bg-village', text:'其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。', next:'v2' },
  v2: { bg:'bg-village', text:'见渔人，乃大惊，问所从来。', next:'v3' },
  v3: { bg:'bg-village', text:'你说了外面的事。老人只是摇头。', next:'era1' },
  era1: { bg:'bg-village', type:'era', next:'v5',
          intro:'桌上摊着几块旧木牌，还有一块刻着「唐」。老人却把它拨到一边：「外面换的年号，我们不必记。」\n「外面……如今是何世？」',
          hint:'朝代的先后，不对。' },
  v5: { bg:'bg-village', text:'自云先世避秦时乱，率妻子邑人来此绝境，不复出焉。', next:'v5b' },
  v5b: { bg:'bg-village', text:'问今是何世，乃不知有汉，无论魏晋。\n\n「六百年了，外面换了三十个年号。」\n「我们只记一件事：人还活着，树还开着。」', next:'feast1' },
  feast1: { bg:'bg-village', type:'feast', next:'v7',
            intro:'老人留你吃饭。桌上摆着酒壶、炖鸡、青菜、豆腐与腌菜。\n「山中粮少，但来客必饱。外面的人苦，我们还记着。」',
            hint:'礼数错了。想想老人说的先后。' },
  v7: { bg:'bg-village', text:'余人各复延至其家，皆出酒食。', next:'old1' },
  old1: { bg:'bg-village', type:'oldmarks', next:'v9',
          intro:'土墙上，有几枚褪了色的印。',
          lines:['第一枚：先人携粮种入山。不是逃，是保。', '第二枚：带走医书与匠谱，怕外面一把火烧尽。', '……第三枚，只刻了一半，人就没回来。'] },
  v9: { bg:'bg-village', text:'原来，桃源不是躲进来的地方。\n是先人把文明的火种，藏进了山里。\n后来的人，一个也没有回去。', next:'bSign' },
  bSign: { bg:'bg-village', type:'sign', text:'要不要留下点什么？', next:'c1' },

  c1: { bg:'bg-dusk', text:'停数日，辞去。此中人语云：「不足为外人道也。」', next:'cFork' },
  cFork: { bg:'bg-dusk', type:'forks', next:'c3',
           intro:'三处岔路，对应三段记忆：外面的黑、这里的暖、你为何而来。\n后来的先散去——最早的那一点，会留到最后。',
           hint:'寻向所志，遂迷。' },
  c3: { bg:'bg-dusk', text:'你走出了桃林，看见了来时的溪。\n可溪上的桥，不在了。', next:'cSign' },
  cSign: { bg:'bg-dusk', type:'sign', text:'你在这里，留下过痕迹。要不要留下点什么？', next:'c2' },
  c0: { bg:'bg-dusk', text:'你什么也没有留下。', next:'c5' },
  c2: { bg:'bg-dusk', type:'marks', next:'cSeal' },
  cSeal: { bg:'bg-dusk', type:'sealSubmit', next:'c5' },
  c4: { bg:'bg-dusk', text:'这些，你真的都要带走吗？', next:'c2' },
  c5: { bg:'bg-dusk', type:'buttons', buttons:[
          { label:'守 口', go:'endA1' }, { label:'告 官', go:'endB1' } ] },

  endA1: { bg:'bg-endA', text:'你什么也没有说。\n你替他们，守住了最后一口气。', next:'endA2' },
  endA2: { bg:'bg-endA', text:'桃花源，还在那里。', next:'endA3' },
  endA3: { bg:'bg-endA', text:'后遂无问津者。\n\n保护一份净土，本身就是一种抵抗。\n\n桃花源不是终点——它是你见过黑暗之后，选择如何立足的镜子。', next:'endA4' },
  endA4: { bg:'bg-endA', type:'buttons', buttons:[{label:'结 束', go:'intro1'}, {label:'若当初，选了另一条路…', go:'c5', minor:true}] },
  endB1: { bg:'bg-endB', text:'他们含泪送你到村口：「去吧，让外面的人知道，还有一处地方是亮的。」\n\n太守即遣人随其往。', next:'endB2' },
  endB2: { bg:'bg-endB', text:'寻向所志，遂迷，不复得路。', next:'endB3' },
  endB3: { bg:'bg-endB', text:'路，在你带人回来的那一刻，关了。\n可你带出去的那个名字，还在人嘴里。\n\n把火种带回黑暗，本身就是一种抵抗。\n\n桃花源不是终点——它是你见过黑暗之后，选择如何立足的镜子。', next:'endB4' },
  endB4: { bg:'bg-endB', type:'buttons', buttons:[{label:'结 束', go:'intro1'}, {label:'若当初，选了另一条路…', go:'c5', minor:true}] }
};
