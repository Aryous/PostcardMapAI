<div align="center">

# MapPostcard AI

**将地图上的任意位置转化为 AI 手绘明信片**

[English](./README.md) · [在线体验](https://postcard-map-ai.vercel.app) · [反馈问题](https://github.com/Aryous/PostcardMapAI/issues)

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://postcard-map-ai.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)

</div>

---

## 功能特性

- **随意探索** — 拖动地图到世界任意角落，通过反向地理编码自动识别地名
- **多种艺术风格** — 水彩、复古、墨线素描、油画等
- **明信片背面** — 与正面风格匹配的背面同步生成
- **上传照片** — 把自己加入场景，AI 以明信片画风重新绘制你的形象
- **历史记录** — 浏览器本地保存最近 5 张生成结果
- **随机探索** — 罗盘按钮随机跳转城市 + 随机风格，一键获取灵感
- **费用估算** — 每次生成后显示 token 用量和预估 USD 费用

## 演示案例

| | | |
|:---:|:---:|:---:|
| ![水彩 · 巴塞罗那](./img/水彩/postcard-260310-巴塞罗那西班牙-101207-front.png) | ![油画 · 伦敦](./img/油画/postcard-260310-英格兰CityofWestminster-101354-front.png) | ![古韵 · 桂林](./img/古韵/postcard-260310-桂林-113724-front.png) |
| **水彩** · 巴塞罗那 | **油画** · 伦敦 | **古韵** · 桂林 |
| ![复古 · 东京](./img/复古/postcard-260310-杉並區日本-100929-front.png) | ![素描 · 成都](./img/素描/postcard-260310-武侯区中国-113559-front.png) | ![赛博朋克 · 新加坡](./img/赛博朋克/postcard-260310-新加坡-114117-front.png) |
| **复古** · 东京 | **素描** · 成都 | **赛博朋克** · 新加坡 |

## 本地运行

**前置条件：** Node.js 18+

```bash
git clone https://github.com/Aryous/PostcardMapAI.git
cd PostcardMapAI
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

> **API Key：** 免费申请：[aistudio.google.com/apikey](https://aistudio.google.com/apikey)
> 直接执行 `npm run dev` 时，请在应用内（左下角钥匙图标）输入你自己的 Key。它只会保存在当前浏览器会话的 `sessionStorage` 中。

如果要在本地测试“服务器端默认 Key”方案，请改用 Vercel Functions：

```bash
GEMINI_API_KEY=你的Key
vercel dev
```

`npm run dev` 只会启动 Vite 前端，不会运行 `api/` 代理路由。

## 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

部署完成后，在 **Settings → Environment Variables** 添加：

| 变量名 | 值 |
|--------|----|
| `GEMINI_API_KEY` | 仅供 Vercel Functions 使用的默认 Gemini API Key |

### CLI 部署

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 连接 GitHub（推荐）

1. 将本仓库推送至你的 GitHub 账号
2. 访问 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 添加 `GEMINI_API_KEY` 环境变量，供服务器端代理使用
4. 之后每次推送到 `main` 分支均自动部署

用户仍可在应用内临时覆盖为自己的 Gemini Key；该 Key 只保存在当前浏览器会话中。

## 技术栈

- **React + TypeScript + Vite**
- **Leaflet** — 交互式地图
- **Google Gemini API**（`gemini-2.5-flash-image`）— 图像生成
- **html2canvas** — 地图截图
- **Nominatim** — 反向地理编码（OpenStreetMap）
- **Tailwind CSS**（CDN 引入）

---

<div align="center">
  <sub><a href="https://postcard-map-ai.vercel.app">postcard-map-ai.vercel.app</a></sub>
</div>
