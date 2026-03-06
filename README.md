<div align="center">
  <img width="1200" height="475" alt="MapPostcard AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>MapPostcard AI</h1>

  <p>
    <a href="#english">English</a> · <a href="#中文">中文</a>
  </p>

  <p>
    <a href="https://postcard-map-ai.vercel.app"><strong>Live Demo</strong></a> ·
    <a href="https://github.com/Aryous/PostcardMapAI/issues">Report Bug</a>
  </p>
</div>

---

## English

**MapPostcard AI** turns any location on the map into a handcrafted postcard — front and back — powered by Google Gemini's image generation.

### Features

- **Pan & explore** — move the map to any place in the world; the location is detected automatically via reverse geocoding
- **Multiple art styles** — watercolor, vintage, ink sketch, oil painting, and more
- **Postcard back** — a matching decorative back side is generated alongside the front
- **Upload a photo** — add yourself into the scene; the AI redraws you in the postcard's artistic style
- **History** — last 5 generated postcards are kept in your browser
- **Lucky spin** — the compass button picks a random city and style for instant inspiration
- **Cost estimate** — token usage and estimated USD cost displayed after each generation

### Getting Started (Local)

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/Aryous/PostcardMapAI.git
cd PostcardMapAI

# 2. Install dependencies
npm install

# 3. Set your API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Don't have an API key? Get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
> You can also enter your key directly in the app UI (bottom-left key icon) without touching any config files.

### Deploy to Vercel

#### Option A — One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

After deploying, go to your project's **Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |

This sets a shared default key for all visitors. Each user can also override it with their own key via the in-app UI.

#### Option B — Deploy via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Then add the environment variable in the Vercel dashboard as described above.

#### Option C — Connect GitHub (recommended for ongoing development)

1. Push this repo to your GitHub account
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add the `GEMINI_API_KEY` environment variable
4. Every `git push` to `main` will auto-deploy

### Tech Stack

- **React + TypeScript + Vite**
- **Leaflet** — interactive map
- **Google Gemini API** (`gemini-2.5-flash-image`) — image generation
- **html2canvas** — map screenshot
- **Nominatim** — reverse geocoding (OpenStreetMap)
- **Tailwind CSS** (CDN)

---

## 中文

**MapPostcard AI** — 在地图上框选任意位置，AI 将其转化为手绘风格明信片（正面 + 背面），由 Google Gemini 图像生成驱动。

### 功能特性

- **随意探索** — 拖动地图到世界任意角落，通过反向地理编码自动识别地名
- **多种艺术风格** — 水彩、复古、墨线素描、油画等
- **明信片背面** — 与正面风格匹配的背面同步生成
- **上传照片** — 把自己加入场景，AI 以明信片画风重新绘制你的形象
- **历史记录** — 浏览器本地保存最近 5 张生成结果
- **随机探索** — 罗盘按钮随机跳转城市 + 随机风格，一键获取灵感
- **费用估算** — 每次生成后显示 token 用量和预估 USD 费用

### 本地运行

**前置条件：** Node.js 18+

```bash
# 1. 克隆仓库
git clone https://github.com/Aryous/PostcardMapAI.git
cd PostcardMapAI

# 2. 安装依赖
npm install

# 3. 配置 API Key
echo "GEMINI_API_KEY=你的Key" > .env.local

# 4. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

> 没有 API Key？免费申请：[aistudio.google.com/apikey](https://aistudio.google.com/apikey)
> 也可以直接在应用内（左下角钥匙图标）输入 Key，无需修改任何配置文件。

### 部署到 Vercel

#### 方式一 — 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

部署完成后，进入项目 **Settings → Environment Variables** 添加：

| 变量名 | 值 |
|--------|----|
| `GEMINI_API_KEY` | 你的 Gemini API Key |

这个 Key 作为所有访客的默认 Key。每位用户也可以在应用内通过界面输入自己的 Key 覆盖默认值。

#### 方式二 — CLI 部署

```bash
npm i -g vercel
vercel login
vercel --prod
```

然后在 Vercel 控制台按上方说明添加环境变量。

#### 方式三 — 连接 GitHub（推荐持续开发使用）

1. 将本仓库推送至你的 GitHub 账号
2. 访问 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 添加 `GEMINI_API_KEY` 环境变量
4. 之后每次 `git push` 到 `main` 分支均自动部署

### 技术栈

- **React + TypeScript + Vite**
- **Leaflet** — 交互式地图
- **Google Gemini API**（`gemini-2.5-flash-image`）— 图像生成
- **html2canvas** — 地图截图
- **Nominatim** — 反向地理编码（OpenStreetMap）
- **Tailwind CSS**（CDN 引入）

---

<div align="center">
  <sub>Made with ♥ · <a href="https://postcard-map-ai.vercel.app">postcard-map-ai.vercel.app</a></sub>
</div>
