# 念廿不忘 · 第廿届美术与设计科毕业画展 官网（布条版）

视觉按展览布条设计：代码生成的彩色指纹竖条 + 等高线圈 + 「念廿不忘」书法主视觉。
完整、可独立上线；中英双语（右上角「中 / EN」切换，也可用网址 `?lang=en`）。

## 打开预览
直接双击 `index.html`（3D 陶艺、视频都能播放）。留言墙：`wishes.html`。

## 上线（Vercel）
1. **先确认本文件夹里没有原始素材**（大视频、HEIC 等）——已移到上一层的「素材原档」。
2. 把整个文件夹上传到 GitHub 新仓库（或用 `vercel` CLI 部署）。
3. Vercel → New Project → Framework 选 **Other** → Deploy。

## 页面内容
展讯 · 前言 · 毕业生与筹委会（个人页 `#/s/号码`）· 作品库（11 类 + 搜索）· 得奖作品 ·
3D 陶艺（海报 → 3D 展示、实物局部照片 41 张、鼠迹）· 电子画册 · 活动回顾（6 段视频）·
比赛成绩（绘画 A–D 组、边吃边画、服装设计）· 海报与周边 · 留言墙 · 主办 / 协办单位

## 留言墙
未设置前是「预览模式」（留言只存在访客自己的设备）。
开通方法见 `留言墙设置/设置步骤.md`（Google 试算表 + Apps Script，免费，约 5 分钟），
完成后把网址填进 `guestbook.js` 第 6 行。

## 文件
- `index.html` / `style.css` / `app.js` — 主页面
- `wishes.html` + `guestbook.js` — 留言墙
- `data.js` 作品与同学资料 · `data_en.js` 英文翻译 · `data_extra.js` 陶艺照片 / 比赛成绩 / 视频清单
- `viewer3d.js` 3D 查看器
- `assets/img` 作品 · `assets/book` 画册 · `assets/models` 3D 模型 · `assets/ceramic` 陶艺海报 ·
  `assets/photos` 陶艺实物照 · `assets/video` 回顾视频（720p）· `assets/docs` 比赛简章

## 待补
- 李以柔《宿命》、邱瑾璇《信以立身》没有作品说明（英文版同）
