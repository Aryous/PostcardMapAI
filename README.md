<div align="center">

# MapPostcard AI

**Turn any map location into a handcrafted AI postcard**

[中文](./README.zh.md) · [Live Demo](https://postcard-map-ai.vercel.app) · [Report Bug](https://github.com/Aryous/PostcardMapAI/issues)

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://postcard-map-ai.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)

</div>

---

## Features

- **Pan & explore** — move the map anywhere in the world; location is detected automatically via reverse geocoding
- **Multiple art styles** — watercolor, vintage, ink sketch, oil painting, and more
- **Postcard back** — a matching decorative back side is generated alongside the front
- **Upload a photo** — add yourself into the scene; the AI redraws you in the postcard's artistic style
- **History** — last 5 generated postcards are saved in your browser
- **Lucky spin** — the compass button picks a random city and style for instant inspiration
- **Cost estimate** — token usage and estimated USD cost displayed after each generation

## Gallery

| | | |
|:---:|:---:|:---:|
| ![Watercolor · Barcelona](./img/水彩/postcard-260310-巴塞罗那西班牙-101207-front.png) | ![Oil · London](./img/油画/postcard-260310-英格兰CityofWestminster-101354-front.png) | ![Ancient Ink · Guilin](./img/古韵/postcard-260310-桂林-113724-front.png) |
| **Watercolor** · Barcelona | **Oil Paint** · London | **Ancient Ink** · Guilin |
| ![Vintage · Tokyo](./img/复古/postcard-260310-杉並區日本-100929-front.png) | ![Sketch · Chengdu](./img/素描/postcard-260310-武侯区中国-113559-front.png) | ![Cyberpunk · Singapore](./img/赛博朋克/postcard-260310-新加坡-114117-front.png) |
| **Vintage** · Tokyo | **Sketch** · Chengdu | **Cyberpunk** · Singapore |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/Aryous/PostcardMapAI.git
cd PostcardMapAI
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **API Key:** Get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
> For plain `npm run dev`, enter your own key in the app (bottom-left key icon). It stays in `sessionStorage` for the current browser session only.

To test the secure server-side default key locally, run the Vercel Functions instead:

```bash
GEMINI_API_KEY=your_key_here
vercel dev
```

`npm run dev` only serves the Vite frontend; it does not run the `api/` proxy routes.

## Deploy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

After deploying, add the environment variable in **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Secure default Gemini API key used only by the Vercel Functions |

### CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Connect GitHub (recommended)

1. Push this repo to your GitHub account
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add `GEMINI_API_KEY` as an environment variable for the server-side proxy
4. Every push to `main` auto-deploys

Users can still override the server-side key inside the app with their own Gemini key for the current browser session.

## Tech Stack

- **React + TypeScript + Vite**
- **Leaflet** — interactive map
- **Google Gemini API** (`gemini-2.5-flash-image`) — image generation
- **html2canvas** — map screenshot
- **Nominatim** — reverse geocoding (OpenStreetMap)
- **Tailwind CSS** (CDN)

---

<div align="center">
  <sub><a href="https://postcard-map-ai.vercel.app">postcard-map-ai.vercel.app</a></sub>
</div>
