(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const PAL = ['#8ECBBE', '#94C6E2', '#7FBFD6', '#A6D6CB', '#E9C77E', '#DDA0C4', '#ABA5DD', '#C3DB8E', '#9CCFE0', '#88C3B4'];
const STU = ['#9FD3C4', '#9CCAE2', '#EFCB86', '#E2A8C6', '#B7B2E0', '#CFE29E'];
const A = window.ASSETS || 'assets/';
const thumb = id => `${A}img/${id}_t.webp`, full = id => `${A}img/${id}.webp`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const svgURL = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

/* ============ 指纹纹理 fingerprint ============ */
function dash(R, len) {
  const a = []; let tot = 0;
  while (tot < len * 7) { const on = 18 + R() * 90, off = 2.5 + R() * 6; a.push(on.toFixed(0), off.toFixed(1)); tot += on + off; if (a.length > 14) break; }
  return a.join(' ');
}
function fingerprint(x, y, w, h, col, R, sw = 3.3, gap = 8.6) {
  let s = '';
  const cx = x + w * (0.1 + R() * 0.8), cy = y + h * (0.05 + R() * 0.9);
  const far = Math.max(...[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([a, b]) => Math.hypot(a - cx, b - cy)));
  if (R() < 0.8) {
    const ex = 0.62 + R() * 0.5, rot = R() * Math.PI, p1 = R() * 6.3, p2 = R() * 6.3;
    for (let r = 4 + R() * 4; r < far + gap; r += gap) {
      const n = Math.max(16, Math.min(80, Math.round(r / 2.6)));
      let d = '';
      const wob = R() * 0.5;
      for (let i = 0; i <= n; i++) {
        const t = i / n * Math.PI * 2;
        const rr = r * (1 + 0.06 * Math.sin(3 * t + p1) + 0.035 * Math.sin(5 * t + p2 + wob));
        const px = rr * Math.cos(t), py = rr * Math.sin(t) * ex;
        d += (i ? 'L' : 'M') + (cx + px * Math.cos(rot) - py * Math.sin(rot)).toFixed(1) + ' ' + (cy + px * Math.sin(rot) + py * Math.cos(rot)).toFixed(1);
      }
      s += `<path d="${d}" stroke-dasharray="${dash(R, r * 6)}" stroke-dashoffset="${(R() * 80).toFixed(0)}"/>`;
    }
  } else {
    const amp = h * (0.12 + R() * 0.25), spread = w * (0.35 + R() * 0.4);
    for (let yy = y - amp * 0.2; yy < y + h + amp + gap; yy += gap) {
      const n = Math.ceil(w / 5) + 1; let d = '';
      const k = Math.max(0.08, 1 - Math.abs(yy - cy) / (h * 0.8));
      for (let i = 0; i <= n; i++) {
        const px = x - 4 + i * (w + 8) / n, g = Math.exp(-(((px - cx) / spread) ** 2));
        const py = yy - amp * g * k + Math.sin(px * 0.045 + yy * 0.3) * 1.3;
        d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
      }
      s += `<path d="${d}" stroke-dasharray="${dash(R, w)}" stroke-dashoffset="${(R() * 60).toFixed(0)}"/>`;
    }
  }
  return `<g stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
}
function stripsSVG(W, H, seed) {
  const R = rng(seed); let defs = '', body = '', x = -6 + R() * 6, k = 0;
  const pick = () => PAL[Math.floor(R() * PAL.length)];
  const piece = (poly, col, op, fx, fy, fw, fh) => {
    const id = 'c' + seed + '_' + (k++);
    defs += `<clipPath id="${id}"><polygon points="${poly}"/></clipPath>`;
    body += `<g clip-path="url(#${id})" opacity="${op}">${fingerprint(fx, fy, fw, fh, col, R)}</g>`;
  };
  while (x < W) {
    const cw = 34 + R() * 96; let y = -10 - R() * 30;
    while (y < H) {
      const rest = H - y, sh = R() < 0.12 ? rest + 20 : Math.min(rest + 20, 90 + R() * H * 0.42);
      const op = R() < 0.25 ? 0.45 : 0.95, cut = R();
      if (cut < 0.22 && sh > cw * 1.2) {
        // diagonal split: two triangles-ish with different colours (like the banner)
        const t = cw * (0.8 + R() * 0.6), up = R() < 0.5;
        const a = up ? `${x},${y + t} ${x + cw},${y} ${x + cw},${y + sh} ${x},${y + sh}` : `${x},${y} ${x + cw},${y + t} ${x + cw},${y + sh} ${x},${y + sh}`;
        const b = up ? `${x},${y - 2} ${x + cw - 6},${y - 2} ${x},${y + t - 8}` : `${x + 6},${y - 2} ${x + cw},${y - 2} ${x + cw},${y + t - 8}`;
        piece(a, pick(), op, x, y, cw, sh); piece(b, pick(), 0.95, x, y - 2, cw, t);
      } else {
        piece(`${x},${y} ${x + cw},${y} ${x + cw},${y + sh} ${x},${y + sh}`, pick(), op, x, y, cw, sh);
      }
      y += sh + 7 + R() * 9;
    }
    x += cw + 6 + R() * 9;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="#FBF8E4"/><defs>${defs}</defs>${body}</svg>`;
}
function chipSVG(seed) {
  const R = rng(seed * 97 + 3), col = PAL[seed % PAL.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 84"><rect width="58" height="84" fill="#FBF8E4"/>${fingerprint(0, 0, 58, 84, col, R, 2.4, 6.2)}</svg>`;
}

/* ============ 等高线圈 contour rings ============ */
function contourSVG(seed, col) {
  const R = rng(seed), n = 8 + Math.floor(R() * 9), P = [R() * 6.3, R() * 6.3, R() * 6.3, R() * 6.3];
  const A = [0.18 + R() * 0.12, 0.08 + R() * 0.08, 0.04 + R() * 0.05, 0.02 + R() * 0.03];
  const dx = (R() - 0.5) * 70, dy = (R() - 0.5) * 40, sx = 1.25 + R() * 0.5;
  let s = '';
  for (let k = n; k >= 1; k--) {
    const f = k / n, m = 72; let d = '';
    const cx = 200 + dx * (1 - f), cy = 150 + dy * (1 - f), jit = R() * 0.06;
    for (let i = 0; i <= m; i++) {
      const t = i / m * Math.PI * 2;
      const r = 120 * f * (1 + A[0] * Math.sin(t + P[0]) + A[1] * Math.sin(2 * t + P[1]) + A[2] * Math.sin(3 * t + P[2] + f * 2) + A[3] * Math.sin(5 * t + P[3] + jit * 30));
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(t) * sx).toFixed(1) + ' ' + (cy + r * Math.sin(t) * 0.82).toFixed(1);
    }
    s += `<path d="${d}Z"/>`;
  }
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${col}" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7">${s}</g></svg>`;
}
const CT = ['#9DB6CF', '#D9A9C2', '#A9CDB8', '#C9C08E', '#B8B0D9', '#9FC6D9'];
function sprinkle(el, count, seed) {
  const R = rng(seed);
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div'); d.className = 'ctr';
    const w = 160 + R() * 300;
    Object.assign(d.style, { width: w + 'px', height: w * 0.75 + 'px', left: (R() < 0.5 ? -4 + R() * 22 : 70 + R() * 26) + '%', top: (R() * 85) + '%', animationDelay: (-R() * 18) + 's', animationDuration: (14 + R() * 12) + 's' });
    d.innerHTML = contourSVG(seed * 31 + i * 7 + 1, CT[Math.floor(R() * CT.length)]);
    el.appendChild(d);
  }
}

/* ============ language ============ */
let LANG = (() => { try { const q = new URLSearchParams(location.search).get('lang'); if (q) return q === 'en' ? 'en' : 'zh'; return localStorage.getItem('nnbw_lang') === 'en' ? 'en' : 'zh'; } catch (e) { return 'zh'; } })();
const EN = () => LANG === 'en';
const L = (zh, en) => EN() ? en : zh;

/* ============ data ============ */
const D = window.EXPO_DATA, X = window.EXTRA, EW = window.EN_WORKS || {}, EM = window.EN_MEDIUM || {}, ER = window.EN_ROLE || {};
const SID = Object.fromEntries(D.students.map(s => [s.id, s]));
D.students.forEach(s => s.name = s.name.replace('黄思境', '黄思静'));
const PRI = [10, 7, 9, 5, 2]; // 主席 → 副主席 沈彦孜 → 副主席 郑斯琴 → 主编 → 副主编 → 其余按号码
const rank = s => { const i = PRI.indexOf(s.id); return i < 0 ? 100 + s.id : i; };
const STUDENTS = [...D.students].sort((a, b) => rank(a) - rank(b));
const IG = 'https://www.instagram.com/artdesignchsbp/';
const BOOK_STUDENT = { 10: 13, 7: 17, 9: 21, 5: 25, 2: 29, 11: 33, 6: 37, 12: 41, 1: 45, 3: 49, 8: 53, 4: 57 };
const CHAPTERS = [['目录', 'Contents', 1], ['献词', 'Messages', 3], ['前言', 'Preface', 12], ['郭汶峰', 'Kek Woon Feng', 13], ['沈彦孜', 'Sim Yan Sze', 17], ['郑斯琴', 'Tee Si Qin', 21], ['李以柔', 'Lee Yi Rou', 25], ['刘遵信', 'Lew Jun Xin', 29], ['陈洁思', 'Tan Jie Si', 33], ['林炜欣', 'Lim Wee Xin', 37], ['黄思静', 'Ng Sze Jean', 41], ['刘婉璇', 'Lau Wan Shuen', 45], ['卓婧瑄', 'Toh Jing Xuan', 49], ['邱瑾璇', 'Ally Khoo Jin Xuan', 53], ['古凯歆', 'Ku Kai Xin', 57], ['各科最佳', 'Subject Awards', 61], ['荣誉榜', 'Honour Roll', 68], ['感谢词', 'Thanks', 71], ['班级回忆', 'Class Memories', 73], ['筹委', 'Committee', 78], ['特别鸣谢', 'Acknowledgements', 79]];
const CATS = [['all', '全部', 'All'], ['award', '得奖作品', 'Awarded'], ['paint', '彩绘', 'Colour Painting'], ['oil', '油画', 'Oil'], ['sketch', '素描', 'Drawing'], ['callig', '书法', 'Calligraphy'], ['ink', '水墨', 'Ink Painting'], ['design', '平面设计', 'Graphic Design'], ['craft', '工艺', 'Craft'], ['print', '版画', 'Printmaking'], ['ceramic', '陶艺', 'Ceramics']];
const catName = k => { const c = CATS.find(x => x[0] === k); return c ? L(c[1], c[2]) : k; };
const AWARD_EN = { '书法组': 'Calligraphy', '素描组': 'Drawing', '彩绘组': 'Colour Painting', '油画组': 'Oil Painting', '平面设计组': 'Graphic Design', '水墨画组': 'Ink Painting' };
const sName = s => s ? L(s.name, s.en) : '';
const role = s => L(s.role, ER[s.role] || s.role);
const num = n => String(n).padStart(2, '0');
function item(w) {
  const s = SID[w.sid], e = EW[w.id], mouse = w.cat === 'ceramic';
  const t = EN() ? (mouse ? `${s.en}’s Clay Mouse` : e ? e[0] : w.t) : (mouse ? `${s.name}的老鼠` : w.t);
  const d = EN() ? (mouse ? 'Mouse Trails — a little clay mouse sculpted by each graduate as their “guardian” and alter ego.' : e ? e[1] : '') : (w.d && w.d !== '-' ? w.d : '');
  const med = EN() ? (EM[w.m] || w.m) : w.m;
  return { id: w.img.id, w: w.img.w, h: w.img.h, t, d, who: s ? `${sName(s)} · ${L(num(s.id) + '号', 'No. ' + num(s.id))}` : '', short: sName(s), num: w.sid,
    m: [med, w.size].filter(x => x && x !== '-').join(' · '), m1: med && med !== '-' ? med : catName(w.cat), award: w.award ? L(w.award, AWARD_EN[w.award] || w.award) : '', cat: w.cat, isAward: !!w.award };
}
let ALL = [], order = [];
function buildWorks() {
  ALL = D.works.map(item);
  order = []; const by = STUDENTS.map(s => ALL.filter(w => w.num === s.id && w.cat !== 'ceramic')); let r = 0, added = true;
  while (added) { added = false; by.forEach(l => { if (l[r]) { order.push(l[r]); added = true; } }); r++; }
  ALL.filter(w => w.cat === 'ceramic').forEach(w => order.push(w));
  order.sort((a, b) => (b.isAward ? 1 : 0) - (a.isAward ? 1 : 0));
  ALL.forEach(w => w._h = [w.t, w.who, SID[w.num] && (SID[w.num].en + ' ' + SID[w.num].name), w.m, catName(w.cat), w.award, w.d, (D.works.find(x => x.img.id === w.id) || {}).t].join(' ').toLowerCase());
}

/* ============ hero ============ */
function drawHero() {
  const box = $('#heroStrips'), mob = innerWidth <= 820;
  const W = mob ? 820 : 640, H = mob ? 900 : 1000;
  box.querySelectorAll('.fp').forEach(n => n.remove());
  const img = new Image(); img.className = 'fp fp-anim'; img.alt = '';
  img.src = svgURL(stripsSVG(W, H, mob ? 20261107 : 2026));
  box.prepend(img);
}
drawHero();
let lastMob = innerWidth <= 820;
addEventListener('resize', () => { const m = innerWidth <= 820; if (m !== lastMob) { lastMob = m; drawHero(); buildBook(); } });
$('#heroLogo').src = 'logos/expo.png'; $('#navLogo').src = 'logos/expo.png';
$$('[data-fp]').forEach(c => c.style.backgroundImage = `url("${svgURL(chipSVG(+c.dataset.fp))}")`);
['#info', '#preface', '#grads', '#works', '#awards', '#ceramics', '#book', '#recap', '#results', '#events', 'footer'].forEach((s, i) => sprinkle($(s), s === '#works' ? 4 : 2, 11 + i * 13));
sprinkle($('.hero-text'), 2, 5);

/* ============ schedule & status (Malaysia time) ============ */
const nowMY = new Date(Date.now() + (new Date().getTimezoneOffset() + 480) * 60000);
const ymd = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const today = ymd(nowMY);
const EV = [
  { d: 20261107, t: ['中小学生绘画比赛', 'Primary &amp; Secondary<br>Painting Competition'], k: ['颁奖时间', 'Prize-giving'], h: '3:30 PM', p: 'BP Mall' },
  { d: 20261108, t: ['Eat & Sketch<br>边吃边画速写绘画比赛', 'Eat &amp; Sketch<br>Sketching Competition'], k: ['颁奖时间', 'Prize-giving'], h: '3:00 PM', p: 'BP Mall' },
  { d: 20261108, t: ['第廿届美术与设计科<br>毕业画展开幕典礼', 'Opening Ceremony of<br>the 20th Exhibition'], k: ['开幕时间', 'Opening'], h: '7:30 PM', p: 'BP Mall' },
  { d: 20261109, t: ['创意服装设计<br>与走秀比赛', 'Creative Fashion<br>Design &amp; Runway'], k: ['服装秀时间', 'Runway show'], h: '7:30 PM', p: 'BP Mall' },
  { d: 20261116, t: ['华中展览厅展出<br>16 – 19 NOV', 'Exhibition at<br>CHSBP Hall · 16–19 NOV'], k: ['开放时间', 'Open'], h: '7:30 AM – 3 PM', p: ['华中展览厅', 'CHSBP Hall'], end: 20261119 },
];
const WK = ['日一二三四五六', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']];
function renderSched() {
  $('#sched').innerHTML = EV.map((e, i) => {
    const dd = new Date(2026, 10, e.d % 100), end = e.end || e.d;
    const cls = (today >= e.d && today <= end) ? 'today' : end < today ? 'past' : '';
    const p = Array.isArray(e.p) ? L(...e.p) : e.p;
    return `<div class="ev rv in ${cls}" data-today="${L('今天', 'Today')}"><span class="bar" style="background:${PAL[i * 2 % PAL.length]}"></span><div class="d">${num(e.d % 100)}/11<small>${L('星期' + WK[0][dd.getDay()], WK[1][dd.getDay()])} · ${p}</small></div><h3>${L(...e.t)}</h3><div class="t">${L(...e.k)}<b>${e.h}</b></div></div>`;
  }).join('');
  let live;
  if (today < 20261107) live = L('即将开展 · 07 NOV BP Mall', 'Opening soon · 07 NOV at BP Mall');
  else if (today <= 20261109) live = L('BP Mall 正在展出 · 10:00 AM – 10:00 PM', 'Now showing at BP Mall · 10 AM – 10 PM');
  else if (today < 20261116) live = L('下一站：华中展览厅 · 16 – 19 NOV', 'Next stop: CHSBP Hall · 16 – 19 NOV');
  else if (today <= 20261119) live = L('华中展览厅 正在展出 · 07:30 AM – 03:00 PM', 'Now showing at CHSBP Hall · 7:30 AM – 3 PM');
  else live = L('展览已圆满落幕 · 线上展厅持续开放', 'The exhibition has ended · the online gallery stays open');
  $('#liveBadge').innerHTML = `<span class="live rv in"><i></i>${live}</span>`;
}

/* ============ lightbox ============ */
let LB = [], LBi = 0;
function openLB(list, i) { LB = list; LBi = i; showLB(); $('#lbOv').classList.add('open'); document.body.style.overflow = 'hidden'; }
function showLB() {
  const it = LB[LBi], img = $('#lbImg');
  const lo = it.thumbSrc || thumb(it.id), hi = it.fullSrc || full(it.id);
  img.src = lo; const pre = new Image(); pre.onload = () => { if (LB[LBi] === it) img.src = hi; }; pre.src = hi;
  img.alt = it.t || '';
  $('#lbT').textContent = it.t ? (it.raw ? it.t : EN() ? it.t : `《${it.t}》`) : '';
  $('#lbM').textContent = it.m || '';
  $('#lbD').textContent = it.d || '';
  $('#lbA').textContent = it.award ? '🏆 ' + L('得奖 · ', 'Award · ') + it.award : ''; $('#lbA').hidden = !it.award;
  $('#lbWho').textContent = it.who || ''; $('#lbWho').classList.toggle('link', !!it.num);
  $('#lbWho').onclick = it.num ? () => { closeAll(); openStudent(it.num); } : null;
  $('#lbPrev').style.display = $('#lbNext').style.display = LB.length > 1 ? '' : 'none';
  $('#lbN').textContent = LB.length > 1 ? `${LBi + 1} / ${LB.length}` : '';
}
const step = n => { LBi = (LBi + n + LB.length) % LB.length; showLB(); };
$('#lbPrev').onclick = e => { e.stopPropagation(); step(-1); };
$('#lbNext').onclick = e => { e.stopPropagation(); step(1); };
function closeAll() { $$('.ov').forEach(o => o.classList.remove('open')); document.body.style.overflow = ''; if (location.hash.startsWith('#/s/')) history.replaceState(null, '', '#grads'); }
$$('[data-close]').forEach(el => el.addEventListener('click', e => {
  if (e.target === el || el.classList.contains('x')) {
    const ov = el.closest('.ov'); ov.classList.remove('open');
    if (ov.id === 'drOv' && location.hash.startsWith('#/s/')) history.replaceState(null, '', '#grads');
    if (!$$('.ov.open').length) document.body.style.overflow = '';
  }
}));
addEventListener('keydown', e => {
  if ($('#stOv').classList.contains('open')) { if (e.key === 'ArrowLeft') stGo(-1); if (e.key === 'ArrowRight') stGo(1); if (e.key === 'Escape') { $('#stOv').classList.remove('open'); document.body.style.overflow = ''; } return; }
  if ($('#lbOv').classList.contains('open')) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); if (e.key === 'Escape') { $('#lbOv').classList.remove('open'); if (!$('#drOv').classList.contains('open')) document.body.style.overflow = ''; } return; }
  if ($('#drOv').classList.contains('open')) { if (e.key === 'Escape') closeAll(); return; }
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 'ArrowLeft') bookGo(-1); if (e.key === 'ArrowRight') bookGo(1);
});
let tx = null;
$('#lbOv').addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
$('#lbOv').addEventListener('touchend', e => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) step(d < 0 ? 1 : -1); tx = null; });

/* ============ graduates ============ */
function renderGrads() {
  $('#gradGrid').innerHTML = STUDENTS.map((s, i) => `<a class="grad rv in" href="#/s/${s.id}" style="--c:${STU[i % STU.length]}">
  <div class="ring"><img loading="lazy" src="${thumb(s.photo.id)}" alt="${esc(sName(s))}"><span class="role">${esc(role(s))}</span></div>
  <h3>${esc(EN() ? s.en : s.name)}</h3><p class="en">${esc(EN() ? s.name : s.en)}</p><p>${L(num(s.id) + ' 号 · ', 'No. ' + num(s.id) + ' · ')}${ALL.filter(w => w.num === s.id && w.cat !== 'ceramic').length}${L(' 件作品', ' works')}</p></a>`).join('');
}
function tileHTML(w, i, hideWho) {
  return `<figure class="tile" data-i="${i}"><img loading="lazy" src="${thumb(w.id)}" width="${w.w}" height="${w.h}" alt="${esc(w.t)}">${w.award ? `<span class="aw">🏆 ${esc(w.award)}</span>` : ''}<figcaption class="cap"><b>${esc(w.t)}</b><span>${hideWho ? '' : esc(w.short) + ' · '}${esc(w.m1)}</span></figcaption></figure>`;
}
let openSid = null;
function openStudent(id) {
  const i = STUDENTS.findIndex(s => s.id === id), s = STUDENTS[i]; if (!s) return; openSid = id;
  const list = ALL.filter(w => w.num === id && w.cat !== 'ceramic').sort((a, b) => (b.isAward ? 1 : 0) - (a.isAward ? 1 : 0));
  const bp = BOOK_STUDENT[s.id];
  const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  $('#drawer').innerHTML = `<button class="x" data-x aria-label="Close">×</button>
    <div class="top" style="--c:${STU[i % STU.length]}"><img class="ph" src="${thumb(s.photo.id)}" alt="${esc(sName(s))}">
      <div class="who"><span class="r">${L(num(s.id) + ' 号 · 筹委 ', 'No. ' + num(s.id) + ' · ')}${esc(role(s))}</span><h3>${esc(EN() ? s.en : s.name)}</h3><p class="en">${esc(EN() ? s.name : s.en)}</p>
      <dl class="facts">
        ${row('Instagram', s.ig ? `<a href="https://www.instagram.com/${esc(s.ig)}/" target="_blank" rel="noopener">@${esc(s.ig)}</a>` : '-')}
        ${row('Email', s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : '-')}
        ${row(L('作品网站', 'Portfolio'), s.web ? `<a href="${esc(s.web)}" target="_blank" rel="noopener">${L('个人作品集', 'Personal site')} ↗</a>` : '-')}
        ${row(L('画册', 'Art book'), bp ? `<a href="#book" data-bp="${bp}">${L(`第 ${bp} 页起`, `From page ${bp}`)} →</a>` : '-')}
      </dl></div>
      ${s.mouse ? `<button class="mouse-mini" data-mouse title="Mouse Trails"><img src="${thumb(s.mouse.id)}" alt=""><span>${L('鼠迹', 'Clay mouse')}</span></button>` : ''}</div>
    <div class="body"><p class="cnt">${L(`个人作品集 · ${list.length} 件`, `Portfolio · ${list.length} works`)}</p><div class="masonry">${list.map((w, k) => tileHTML(w, k, true)).join('')}</div></div>`;
  const dr = $('#drawer');
  dr.querySelector('[data-x]').onclick = closeAll;
  dr.querySelectorAll('.tile').forEach(t => { t.classList.add('in'); t.onclick = () => openLB(list, +t.dataset.i); });
  const m = dr.querySelector('[data-mouse]'); if (m) m.onclick = () => openLB([item(D.works.find(w => w.cat === 'ceramic' && w.sid === s.id))], 0);
  const b = dr.querySelector('[data-bp]'); if (b) b.onclick = e => { e.preventDefault(); closeAll(); goPage(+b.dataset.bp); $('#book').scrollIntoView({ behavior: 'smooth' }); };
  dr.scrollTop = 0; $('#drOv').classList.add('open'); document.body.style.overflow = 'hidden';
  document.title = `${sName(s)} · ${L('念廿不忘 毕业画展', 'Nian Nian Bu Wang Exhibition')}`;
}
function onHash() { const m = location.hash.match(/^#\/s\/(\d+)/); if (m) openStudent(+m[1]); else { openSid = null; $('#drOv').classList.remove('open'); document.title = L('念廿不忘 · 华仁中学第廿届美术与设计科毕业画展', 'Nian Nian Bu Wang · The 20th Art & Design Graduation Exhibition, CHSBP'); if (!$('#lbOv').classList.contains('open')) document.body.style.overflow = ''; } }
addEventListener('hashchange', onHash);

/* ============ wall ============ */
let cat = 'all', shown = 0, cur = [], q = ''; const PAGE = 24;
function renderFilters() {
  const counts = { all: ALL.length, award: ALL.filter(w => w.isAward).length }; ALL.forEach(w => counts[w.cat] = (counts[w.cat] || 0) + 1);
  $('#filters').innerHTML = CATS.filter(([k]) => counts[k]).map(([k]) => `<button class="${k === cat ? 'on' : ''}${k === 'award' ? ' aw-btn' : ''}" data-c="${k}">${k === 'award' ? '🏆 ' : ''}${catName(k)}<span>${counts[k]}</span></button>`).join('');
  $$('#filters button').forEach(b => b.onclick = () => { cat = b.dataset.c; $$('#filters button').forEach(x => x.classList.toggle('on', x === b)); renderWall(true); });
}
let qt; $('#search').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { q = e.target.value.trim().toLowerCase(); renderWall(true); }, 150); });
function renderWall(reset) {
  if (reset) {
    shown = 0; $('#wall').innerHTML = '';
    cur = order.filter(w => (cat === 'all' || (cat === 'award' ? w.isAward : w.cat === cat)) && (!q || q.split(/\s+/).every(t => w._h.includes(t))));
  }
  const next = cur.slice(shown, shown + PAGE);
  $('#wall').insertAdjacentHTML('beforeend', next.map((w, k) => tileHTML(w, shown + k)).join(''));
  shown += next.length;
  $$('#wall .tile:not([data-b])').forEach(t => { t.dataset.b = 1; t.onclick = () => openLB(cur, +t.dataset.i); io.observe(t); });
  $('#moreBtn').style.display = shown < cur.length ? '' : 'none';
  $('#moreBtn').textContent = L(`载入更多（还有 ${cur.length - shown} 件）`, `Load more (${cur.length - shown} left)`);
  $('#wallCount').textContent = cur.length ? L(`共 ${cur.length} 件作品`, `${cur.length} works`) : L('没有找到相符的作品', 'No matching works');
}
$('#moreBtn').onclick = () => renderWall(false);

/* ============ awards ============ */
let AW = [];
function renderAwards() {
  AW = ALL.filter(w => w.isAward);
  $('#awardGrid').innerHTML = AW.map((a, i) => `<div class="award rv in" data-i="${i}"><div class="img"><img loading="lazy" src="${thumb(a.id)}" alt="${esc(a.t)}"></div><span class="badge">🏆 ${esc(a.award)}</span><div class="cap"><h3>${EN() ? esc(a.t) : `《${esc(a.t)}》`}</h3><p>${esc(a.short)} · ${esc(a.m)}</p></div></div>`).join('');
  $$('#awardGrid .award').forEach(el => el.onclick = () => openLB(AW, +el.dataset.i));
}

/* ============ ceramics: posters + 3D + photos ============ */
const CP = k => `${A}ceramic/poster-${k}`;
const THEMES = [
  { k: 'town', name: ['不忘小镇', 'Town of Remembrance'], model: `${A}models/town.glb`, mb: '9.2', photos: 'town', desc: ['从一个九宫格棋盘出发，棋子与小配件不断向外延伸，最终演变成结构完整、包容万物的“不忘小镇”。', 'It began as a simple nine-square board. The pieces and little accessories kept spreading outward until they grew into a complete, all-embracing “Town of Remembrance”.'] },
  { k: 'pot', name: ['原始人的日常', 'Daily Life of the Ancients'], model: `${A}models/pot.glb`, mb: '9.9', photos: 'pot', desc: ['以传统彩陶盆为灵感，把陶盆的造型、色彩与纹样变成原始人的身体、住所与工具。', 'Inspired by Neolithic painted pottery basins: their shapes, colours and patterns become the bodies, homes and tools of a lively prehistoric village.'] },
  { k: 'teapot', name: ['树纹茶壶', 'Tree-bark Teapots'], model: `${A}models/teapot.glb`, mb: '8.2', desc: ['全班共同完成。亲手拓印的树皮纹理被“复印”进泥土，壶身如树桩、壶嘴壶把如枝桠。', 'Made by the whole class. Bark textures pressed straight from trees are “printed” into the clay — the pot a stump, the spout and handle its branches.'] },
  { k: 'mice', name: ['鼠迹', 'Mouse Trails'], desc: ['每位同学亲手捏塑的素烧陶土小老鼠，是各自展区的“守护者”与“自我化身”。', 'A little bisque-fired clay mouse sculpted by each graduate — the guardian of their corner and a portrait of themselves.'] }];
const photoItems = k => (X.photos[k] || []).map(([id, w, h], i) => ({ thumbSrc: `${A}photos/${id}_t.webp`, fullSrc: `${A}photos/${id}.webp`, t: L(THEMES.find(t => t.photos === k).name[0] + ' · 局部 ' + (i + 1), THEMES.find(t => t.photos === k).name[1] + ' · detail ' + (i + 1)), raw: 1, m: L('陶艺实物照片', 'Ceramic installation photo') }));
let PI = [];
function renderCeramics() {
  PI = THEMES.map(t => ({ thumbSrc: CP(t.k) + '_t.webp', fullSrc: CP(t.k) + '.webp', t: L(t.name[0] + ' · 主题海报', t.name[1] + ' · Poster'), raw: 1, m: L('陶艺主题海报', 'Ceramic theme poster'), d: L(...t.desc) }));
  $('#cPosters').innerHTML = THEMES.map((t, i) => `<figure class="cposter rv in" data-k="${t.k}"><button class="cposter__img" data-i="${i}" aria-label="${esc(L(...t.name))}"><img loading="lazy" src="${CP(t.k)}_t.webp" alt="${esc(L(...t.name))}"></button>
  <figcaption><b>${L(...t.name)}</b><button class="btn primary go" data-go="${i}">${t.model ? L('进入 3D 展示 →', 'Enter 3D view →') : L('查看全部小老鼠 →', 'See all the mice →')}</button>${t.k === 'town' ? `<button class="photo-link story-link" data-story>📖 ${L('阅读小故事 · 小狐狸游小镇', 'Read the story · Little Fox')}</button>` : ''}${t.photos ? `<button class="photo-link" data-ph="${t.photos}">${L(`实物局部照片 · ${X.photos[t.photos].length} 张`, `${X.photos[t.photos].length} close-up photos`)}</button>` : ''}</figcaption></figure>`).join('');
  $$('.cposter__img').forEach(b => b.onclick = () => openLB(PI, +b.dataset.i));
  $$('[data-go]').forEach(b => b.onclick = () => selectTheme(THEMES[+b.dataset.go]));
  $$('[data-ph]').forEach(b => b.onclick = () => openLB(photoItems(b.dataset.ph), 0));
  $$('[data-story]').forEach(b => b.onclick = () => openStory(0));
  const MI = ALL.filter(w => w.cat === 'ceramic');
  $('#mice').innerHTML = MI.map((m, i) => `<div class="mouse" data-i="${i}"><img loading="lazy" src="${thumb(m.id)}" alt="${esc(m.t)}"><span>${esc(m.short)}</span></div>`).join('');
  $$('.mouse').forEach(el => el.onclick = () => openLB(MI, +el.dataset.i));
  if (curT && !$('#v3d').hidden) fillInfo(curT);
}
let viewer = null, curT = null, loading = false;
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
function fillInfo(t) {
  $('#v3dName').textContent = L(...t.name); $('#v3dDesc').textContent = L(...t.desc);
  const ph = X.photos[t.photos] || [];
  $('#v3dPhotos').innerHTML = ph.length ? `<p class="eyebrow">${L(`实物局部照片 · ${ph.length} 张`, `Close-up photos · ${ph.length}`)}</p><div class="strip">${ph.map(([id], i) => `<img loading="lazy" data-i="${i}" src="${A}photos/${id}_t.webp" alt="">`).join('')}</div>` : '';
  $$('#v3dPhotos img').forEach(im => im.onclick = () => openLB(photoItems(t.photos), +im.dataset.i));
  if (t.k === 'town') { $('#v3dPhotos').insertAdjacentHTML('afterbegin', `<button class="btn ghost st-btn" data-story2>📖 ${L('阅读小故事 · 小狐狸游小镇', 'Read the story · Little Fox')}</button>`); $('[data-story2]').onclick = () => openStory(0); }
  if ($('#v3d').classList.contains('is-live')) $('#v3dHint').textContent = L('拖动旋转 · 滚轮 / 双指缩放 · 双击复位', 'Drag to rotate · scroll / pinch to zoom · double-click to reset');
}
function selectTheme(t) {
  curT = t; $$('.cposter').forEach(c => c.classList.toggle('on', c.dataset.k === t.k));
  if (!t.model) { $('#v3d').hidden = true; $('#miceBox').hidden = false; if (viewer) viewer.stop(); $('#miceBox').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  $('#miceBox').hidden = true; $('#v3d').hidden = false;
  $('#v3dPoster').src = CP(t.k) + '_t.webp'; $('#v3d').classList.remove('is-live');
  if (viewer) viewer.dispose();
  fillInfo(t);
  $('#v3dHint').textContent = webgl ? L(`模型约 ${t.mb} MB，载入中…`, `Loading model (about ${t.mb} MB)…`) : L('当前浏览器不支持 3D 显示', 'This browser does not support 3D (WebGL).');
  $('#v3dBar').style.width = '0';
  $('#v3d').scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (webgl) load3D();
}
async function load3D() {
  if (loading || !curT || !curT.model) return; loading = true; const t = curT;
  try {
    if (!viewer) viewer = new window.GLBViewer($('#v3dCanvas'));
    await viewer.load(t.model, f => $('#v3dBar').style.width = Math.round(f * 100) + '%');
    if (curT !== t) return;
    $('#v3d').classList.add('is-live'); $('#v3dHint').textContent = L('拖动旋转 · 滚轮 / 双指缩放 · 双击复位', 'Drag to rotate · scroll / pinch to zoom · double-click to reset');
  } catch (err) { console.error(err); $('#v3dHint').innerHTML = L('模型载入失败，', 'Failed to load the model. ') + `<button class="link" id="v3dRetry">${L('重试', 'Retry')}</button>`; $('#v3dRetry').onclick = load3D; }
  finally { loading = false; if (curT && curT !== t && curT.model && !$('#v3d').hidden) load3D(); }
}
$('#v3dClose').onclick = () => { $('#v3d').hidden = true; if (viewer) viewer.stop(); $$('.cposter').forEach(c => c.classList.remove('on')); };
$('#v3dReset').onclick = () => viewer && viewer.reset();
$('#v3dSpin').onclick = e => { if (!viewer) return; viewer.spin = !viewer.spin; e.currentTarget.classList.toggle('on', viewer.spin); };
new IntersectionObserver(es => { if (!viewer) return; if (es[0].isIntersecting && $('#v3d').classList.contains('is-live')) viewer.start(); else viewer.stop(); }).observe($('#v3d'));

/* ============ story: 小狐狸游不忘小镇 ============ */
const ST = X.story; let sti = 0;
function showStory(dir) {
  const p = ST.pages[sti], box = $('#stPage');
  const put = () => {
    $('#stImg').src = `${A}story/${num(sti + 1)}.webp`;
    $('#stText').textContent = EN() ? p[1] : p[0];
    $('#stNo').textContent = `${sti + 1} / ${ST.pages.length}`;
    $('#stFill').style.width = ((sti + 1) / ST.pages.length * 100) + '%';
    $('#stPrev').disabled = sti === 0; $('#stNext').disabled = sti === ST.pages.length - 1;
    box.classList.remove('out-l', 'out-r');
    [sti + 1, sti + 2].forEach(j => { if (j < ST.pages.length) { const im = new Image(); im.src = `${A}story/${num(j + 1)}.webp`; } });
  };
  if (!dir) return put();
  box.classList.add(dir > 0 ? 'out-l' : 'out-r'); setTimeout(put, 180);
}
function openStory(i) { sti = i; $('#stTitle').textContent = L(...ST.title); showStory(0); $('#stOv').classList.add('open'); document.body.style.overflow = 'hidden'; }
const stGo = n => { const j = sti + n; if (j < 0 || j >= ST.pages.length) return; sti = j; showStory(n); };
$('#stPrev').onclick = () => stGo(-1); $('#stNext').onclick = () => stGo(1);
$('#stImg').onclick = () => stGo(1);
let sx = null; $('#stOv').addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
$('#stOv').addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) stGo(d < 0 ? 1 : -1); sx = null; });

/* ============ recap videos ============ */
function renderVideos() {
  $('#videos').innerHTML = X.videos.map((v, i) => `<figure class="vid rv in${i === 0 ? ' big' : ''}" data-k="${v.k}"><div class="vbox"><video preload="none" playsinline poster="${A}video/${v.k}.jpg" src="${A}video/${v.k}.mp4"></video><button class="play" aria-label="Play"><span>▶</span></button><span class="len">${v.len}</span></div>
    <figcaption><b>${esc(L(v.zh, v.en))}</b>${v.d ? `<span>${esc(v.d)}</span>` : ''}</figcaption></figure>`).join('');
  $$('.vid').forEach(f => {
    const v = f.querySelector('video'), b = f.querySelector('.play');
    b.onclick = () => { $$('.vid video').forEach(o => o !== v && o.pause()); v.play(); };
    v.onplay = () => { v.controls = true; f.classList.add('playing'); $$('.vid video').forEach(o => o !== v && o.pause()); };
    v.onpause = () => f.classList.remove('playing');
  });
}

/* ============ competition results ============ */
let rSel = 'art';
const PRIZE_EN = { '冠军': 'Champion', '亚军': '1st Runner-up', '季军': '2nd Runner-up', '安慰奖': 'Consolation', '第一名': '1st Place', '第二名': '2nd Place', '第三名': '3rd Place', '最佳模特儿': 'Best Model', '最佳人气奖': 'Most Popular' };
const MEDAL = { '冠军': 'gold', '第一名': 'gold', '亚军': 'silver', '第二名': 'silver', '季军': 'bronze', '第三名': 'bronze' };
function renderResults() {
  $('#rTabs').innerHTML = X.results.map(r => `<button class="${r.k === rSel ? 'on' : ''}" data-r="${r.k}">${esc(L(r.zh, r.en))}<small>${r.d}</small></button>`).join('');
  $$('#rTabs button').forEach(b => b.onclick = () => { rSel = b.dataset.r; renderResults(); });
  const r = X.results.find(x => x.k === rSel), team = r.k === 'fashion';
  $('#rPanel').innerHTML = `<div class="rgroups${r.groups.length > 1 ? ' multi' : ''}">${r.groups.map(g => `<div class="rgroup">${g.zh ? `<h4>${esc(L(g.zh, g.en))}</h4>` : ''}
    <ol>${g.r.map(([p, ...rest]) => {
      const who = team ? rest.map(t => `<span class="team"><b>${esc(t[0])}</b>${t[1] ? `<em>${esc(t[1])}</em>` : ''}</span>`).join('') : rest[0].map(n => `<span>${esc(n)}</span>`).join('');
      return `<li class="${MEDAL[p] || 'other'}"><span class="prize">${MEDAL[p] ? '<i></i>' : ''}${esc(L(p, PRIZE_EN[p] || p))}</span><span class="names">${who}</span></li>`;
    }).join('')}</ol></div>`).join('')}</div>`;
}

/* ============ posters / merch / logos ============ */
const PO = [['efff3fe167', '念廿不忘 · 展览总海报', 'Exhibition Poster', ''], ['4b35d6bab2', '2026 年中小学生绘画比赛', '2026 Primary & Secondary Painting Competition', 'painting-competition.pdf'], ['f4469585e1', 'Eat & Sketch 边吃边画速写绘画比赛', 'Eat & Sketch Sketching Competition', 'eat-and-sketch.pdf'], ['89123ed05b', '梵天一梦 · 全柔创意服装设计与走秀比赛', 'Creative Fashion Design & Runway Competition', 'fashion-competition.pdf']];
function renderPosters() {
  const POI = PO.map(([id, zh, en]) => ({ id, t: L(zh, en), raw: 1, m: L('海报', 'Poster') }));
  $('#posters').innerHTML = PO.map(([id, zh, en, pdf], i) => `<div class="poster rv in"><img loading="lazy" data-i="${i}" src="${thumb(id)}" alt="${esc(L(zh, en))}"><p>${esc(L(zh, en))}</p>${pdf ? `<a class="pdf" href="${A}docs/${pdf}" target="_blank" rel="noopener">${L('下载比赛简章 (PDF) ↓', 'Download rules (PDF, Chinese) ↓')}</a>` : ''}</div>`).join('');
  $$('.poster img').forEach(el => el.onclick = () => openLB(POI, +el.dataset.i));
  const SH = [['merch1', '展服设计 · 立领款 正反面', 'T-shirt design · collared, front & back'], ['merch2', '展服设计 · 圆领款 正反面', 'T-shirt design · crew neck, front & back'], ['merch3', '展服平面稿 · 正面', 'T-shirt flat · front'], ['merch4', '展服平面稿 · 背面', 'T-shirt flat · back']].map(([id, zh, en]) => ({ id, t: L(zh, en), raw: 1, m: L('衍生周边 · 纪念展服', 'Merchandise · exhibition T-shirt'), d: L('以「念廿不忘」书法标题与彩色指纹纹理为主视觉的毕业展纪念服。', 'The exhibition T-shirt, featuring the “念廿不忘” calligraphy and colourful fingerprint textures.') }));
  $('#shirts').innerHTML = SH.map((s, i) => `<figure class="rv in"><img loading="lazy" data-i="${i}" src="${thumb(s.id)}" alt="${esc(s.t)}"><figcaption>${esc(s.t)}</figcaption></figure>`).join('');
  $$('#shirts img').forEach(el => el.onclick = () => openLB(SH, +el.dataset.i));
}
$('#hostLogos').innerHTML = `<a href="https://chsbp.edu.my/" target="_blank" rel="noopener" title="Chinese High School Batu Pahat"><img src="logos/chsbp.png" alt="CHSBP" style="height:78px"></a><a href="${IG}" target="_blank" rel="noopener" title="Instagram @artdesignchsbp"><img src="logos/expo.png" alt="Instagram @artdesignchsbp" style="height:70px"></a>`;
$('#coLogos').innerHTML = [['https://www.facebook.com/batupahatmall/', 'bpm.png', 'Batu Pahat Mall'], ['https://mia.edu.my/', 'mia.png', 'Malaysian Institute of Art'], ['https://undo.edu.my/', 'undo.png', 'UNDO Academy'], ['https://www.toa.edu.my/', 'toa.png', 'The One Academy'], ['https://linktr.ee/odesapparel_', 'yodes.jpg', 'YODES']]
  .map(([u, f, n]) => `<a href="${u}" target="_blank" rel="noopener" title="${n}"><img loading="lazy" src="logos/${f}" alt="${n}"${f === 'toa.png' ? ' style="height:30px"' : f === 'yodes.jpg' ? ' style="height:84px;border-radius:8px"' : ''}></a>`).join('');

/* ============ art book ============ */
const N = 80, pg = k => k === 'cover' || k === 'back' ? k : 'p' + String(k).padStart(2, '0');
let SP = [], bi = 0;
function buildBook() {
  const mob = innerWidth <= 820, keep = SP[bi] ? SP[bi].find(x => x !== null) : 'cover';
  if (mob) SP = [['cover'], ...Array.from({ length: N }, (_, i) => [i]), ['back']];
  else { SP = [[null, 'cover'], [null, 0]]; for (let i = 1; i < N - 1; i += 2) SP.push([i, i + 1]); SP.push([N - 1, null], ['back', null]); }
  bi = Math.max(0, SP.findIndex(s => s.includes(keep))); $('#bRange').max = SP.length - 1; renderSpread(0);
}
const lab = k => k === 'cover' ? L('封面', 'Cover') : k === 'back' ? L('封底', 'Back') : 'P.' + String(k).padStart(2, '0');
function renderChapters() {
  $('#bChap').innerHTML = `<option value="">${L('章节跳转…', 'Jump to…')}</option>` + CHAPTERS.map(([zh, en, p]) => `<option value="${p}">${L(zh, en)} · P.${num(p)}</option>`).join('');
}
function renderSpread(dir) {
  const sp = $('#spread');
  const put = () => {
    const s = SP[bi];
    sp.className = 'spread' + (s.length === 1 ? ' single' : '');
    sp.innerHTML = s.map(k => k === null ? '<div class="blank"></div>' : `<img src="${A}book/${pg(k)}.webp" data-k="${k}" alt="${lab(k)}">`).join('');
    sp.querySelectorAll('img').forEach(im => im.onclick = e => { e.stopPropagation(); zoomPage(im.dataset.k); });
    $('#bNo').textContent = s.filter(k => k !== null).map(lab).join(' – ');
    $('#bRange').value = bi; $('#bPrev').disabled = bi === 0; $('#bNext').disabled = bi === SP.length - 1;
    const p = s.filter(k => typeof k === 'number').pop(); let ch = '';
    if (typeof p === 'number') CHAPTERS.forEach(([, , at]) => { if (p >= at) ch = String(at); });
    $('#bChap').value = ch;
    [bi + 1, bi - 1, bi + 2].forEach(j => SP[j] && SP[j].forEach(k => { if (k !== null) { const im = new Image(); im.src = `${A}book/${pg(k)}.webp`; } }));
  };
  if (!dir) return put();
  sp.classList.add(dir > 0 ? 'turn-next' : 'turn-prev'); setTimeout(put, 220);
}
function zoomPage(k) {
  const pages = ['cover', ...Array.from({ length: N }, (_, i) => i), 'back'];
  const list = pages.map(x => ({ thumbSrc: `${A}book/${pg(x)}.webp`, fullSrc: typeof x === 'number' ? `${A}book/z${String(x).padStart(2, '0')}.webp` : `${A}book/${pg(x)}.webp`, t: L('画册 · ', 'Art book · ') + lab(x), raw: 1, m: L('《念廿不忘》毕业画册', '“Nian Nian Bu Wang” graduation art book') }));
  openLB(list, pages.findIndex(x => String(x) === String(k)));
}
function goPage(p) { const j = SP.findIndex(s => s.includes(p)); if (j >= 0) { bi = j; renderSpread(0); } }
function bookGo(n) { const r = $('#book').getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return; go(n); }
function go(n) { const j = bi + n; if (j < 0 || j >= SP.length) return; bi = j; renderSpread(n); }
$('#bPrev').onclick = () => go(-1); $('#bNext').onclick = () => go(1);
$('#hitL').onclick = () => go(-1); $('#hitR').onclick = () => go(1);
$('#bRange').oninput = e => { bi = +e.target.value; renderSpread(0); };
$('#bChap').onchange = e => { if (e.target.value !== '') goPage(+e.target.value); };
let bx = null; $('.stage').addEventListener('touchstart', e => bx = e.touches[0].clientX, { passive: true });
$('.stage').addEventListener('touchend', e => { if (bx === null) return; const d = e.changedTouches[0].clientX - bx; if (Math.abs(d) > 40) go(d < 0 ? 1 : -1); bx = null; });

/* ============ wishes preview ============ */
let WISHES = [];
async function loadWishes() {
  try { WISHES = await window.GB.list(); } catch (e) { console.warn(e); WISHES = []; }
  renderWishes();
}
function renderWishes() {
  window.GB.lanes($('#miniLanes'), WISHES.slice(-60), innerWidth <= 820 ? 2 : 3, EN());
  $('#wishCount').textContent = WISHES.length ? L(`已有 ${WISHES.length} 则祝福`, `${WISHES.length} wishes so far`) : '';
}

/* ============ language switch ============ */
function applyStatic() {
  document.documentElement.lang = EN() ? 'en' : 'zh-Hans';
  $$('[data-en]').forEach(el => { if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML; el.innerHTML = EN() ? el.dataset.en : el.dataset.zh; });
  $$('[data-en-ph]').forEach(el => { if (el.dataset.zhPh === undefined) el.dataset.zhPh = el.placeholder; el.placeholder = EN() ? el.dataset.enPh : el.dataset.zhPh; });
  $('#langBtn').classList.toggle('is-en', EN());
}
function renderAll() {
  applyStatic(); buildWorks(); renderSched(); renderGrads(); renderFilters(); renderWall(true); renderAwards(); renderCeramics();
  renderChapters(); renderSpread(0); renderVideos(); renderResults(); renderPosters(); renderWishes();
  if (openSid) openStudent(openSid); else onHash();
  if ($('#stOv').classList.contains('open')) { $('#stTitle').textContent = L(...ST.title); showStory(0); }
}
$('#langBtn').onclick = () => {
  LANG = EN() ? 'zh' : 'en'; try { localStorage.setItem('nnbw_lang', LANG); } catch (e) {}
  const u = new URL(location.href); u.searchParams.delete('lang'); history.replaceState(null, '', u);
  if ($('#lbOv').classList.contains('open')) $('#lbOv').classList.remove('open');
  renderAll();
};

/* ============ init / reveal / nav ============ */
var io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
buildBook();
renderAll();
$$('.rv:not(.in)').forEach(el => io.observe(el));
loadWishes();
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * 0.6 || nav.classList.contains('menu'));
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#burger').onclick = () => { nav.classList.toggle('menu'); onScroll(); };
$$('.nav ul a').forEach(a => a.onclick = () => { nav.classList.remove('menu'); onScroll(); });
})();
