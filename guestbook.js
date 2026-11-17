/* ===== 留言墙 Guestbook =====
 * 留言保存在 Google 试算表（经 Google Apps Script）。
 * 部署好 Apps Script 后，把「网页应用」网址贴到下面 GUESTBOOK_URL 的引号里即可。
 * 未填写时为「预览模式」：留言只保存在访客自己的浏览器里。
 */
window.GUESTBOOK_URL = 'https://script.google.com/macros/s/AKfycbxb2QlgizZtq4QFU1I52OpgUsFcc4zNNEsbMqlMNafdvy_bfr_GVFa1S8oOJQN3lx1LNQ/exec';

window.GB = (() => {
  const URL = window.GUESTBOOK_URL.trim();
  const LS = 'nnbw_wishes_local';
  const local = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } };
  const saveLocal = a => { try { localStorage.setItem(LS, JSON.stringify(a.slice(-300))); } catch (e) {} };
  const clean = s => String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  async function list() {
    if (!URL) return local();
    const r = await fetch(URL + (URL.includes('?') ? '&' : '?') + 't=' + Date.now());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const mine = local().filter(m => m.pending && !j.some(x => x.m === m.m && x.n === m.n));
    return j.concat(mine);
  }
  async function post(o) {
    const msg = { n: clean(o.n).slice(0, 20), to: clean(o.to).slice(0, 20), m: clean(o.m).slice(0, 120), t: new Date().toISOString() };
    if (!msg.m) throw new Error('empty');
    if (!URL) { const a = local(); a.push(msg); saveLocal(a); return msg; }
    // Apps Script 网页应用：用 text/plain 避免 CORS 预检；no-cors 下无法读回应，乐观显示
    await fetch(URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ n: msg.n, to: msg.to, m: msg.m }) });
    const a = local(); a.push({ ...msg, pending: 1 }); saveLocal(a);
    return msg;
  }
  const PAL = ['#DDEFE9', '#DCEBF5', '#F7EBCF', '#F4DDEA', '#E6E3F6', '#E9F2D6', '#FBE3D6'];
  const INK = ['#2F6B5E', '#2E5C7E', '#7A5A17', '#8A3F68', '#4E4889', '#55702A', '#8A4A2C'];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) | 0; return Math.abs(h); };
  function card(m, en, fresh) {
    const k = hash((m.m || '') + (m.n || '')) % PAL.length;
    const from = m.n || (en ? 'Anonymous' : '匿名');
    const to = m.to ? (en ? ' → ' : ' → ') + esc(m.to) : '';
    return `<figure class="wish${fresh ? ' fresh' : ''}" style="--bg:${PAL[k]};--ink:${INK[k]}"><blockquote>${esc(m.m)}</blockquote><figcaption>— ${esc(from)}${to}</figcaption></figure>`;
  }
  // 把留言分配到多条横向流动轨道（每条复制一份做无缝循环）
  function lanes(box, msgs, n, en, freshMsg) {
    const list = msgs.slice().reverse();
    if (!list.length) { box.innerHTML = `<p class="wish-empty">${en ? 'No wishes yet — be the first to write one!' : '还没有留言，成为第一个写下祝福的人吧！'}</p>`; return; }
    let L;
    if (list.length >= n * 5) { L = Array.from({ length: n }, () => []); list.forEach((m, i) => L[i % n].push(m)); }
    else {
      // 留言不多时：每条轨道用不同起点轮换全部留言，避免同一条重复
      const step = Math.max(1, Math.round(list.length / n));
      L = Array.from({ length: n }, (_, i) => { const k = (i * step + i) % list.length; return list.slice(k).concat(list.slice(0, k)); });
    }
    L = L.map(l => { let x = l; while (x.length < 6) x = x.concat(l); return x; });
    if (freshMsg) L[0] = [freshMsg].concat(L[0].filter(m => m !== freshMsg));
    box.innerHTML = L.map((l, i) => {
      const html = l.map((m, j) => card(m, en, freshMsg && i === 0 && j === 0 && m === freshMsg)).join('');
      const dur = Math.max(28, l.length * 7) * (1 + (i % 3) * 0.18);
      return `<div class="lane${i % 2 ? ' rev' : ''}" style="--dur:${dur.toFixed(0)}s"><div class="track">${html}${html.replace(/ fresh"/g, '"')}</div></div>`;
    }).join('');
  }
  return { list, post, lanes, card, live: !!URL };
})();
