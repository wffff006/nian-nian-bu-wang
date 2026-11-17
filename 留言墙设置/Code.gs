/**
 * 念廿不忘 · 留言墙后台（Google Apps Script）
 * 用法见同一文件夹里的「设置步骤.md」。
 *
 * 试算表第一行请放标题：时间 | 名字 | 送给 | 留言 | 隐藏
 * 想删除不当留言：在「隐藏」那一栏填 1（或直接删掉那一行）。
 */
const SHEET_NAME = '留言';
const MAX_SHOW = 500;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['时间', '名字', '送给', '留言', '隐藏']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// 防止公式注入：以 = + - @ 开头的内容前面加 '
function safe_(s, n) {
  s = String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const out = rows
    .filter(r => r[3] && !r[4])
    .slice(-MAX_SHOW)
    .map(r => ({ t: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), n: String(r[1]), to: String(r[2]), m: String(r[3]) }));
  return json_(out);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const m = safe_(d.m, 120);
    if (!m) return json_({ ok: false });
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    sheet_().appendRow([new Date(), safe_(d.n, 20), safe_(d.to, 20), m, '']);
    lock.releaseLock();
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
