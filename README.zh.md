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
> 可直接在应用内（左下角钥匙图标）输入，无需修改任何配置文件。

或者创建 `.env.local` 文件：

```
GEMINI_API_KEY=你的Key
```

## 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

部署完成后，在 **Settings → Environment Variables** 添加：

| 变量名 | 值 |
|--------|----|
| `GEMINI_API_KEY` | 你的 Gemini API Key（可选——用户也可在应用内自行输入） |

### CLI 部署

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 连接 GitHub（推荐）

1. 将本仓库推送至你的 GitHub 账号
2. 访问 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 可选添加 `GEMINI_API_KEY` 环境变量
4. 之后每次推送到 `main` 分支均自动部署

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
