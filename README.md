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

## Screenshots

| Landing | App |
|:---:|:---:|
| ![Landing page](./img/screenshot-app.png) | ![Main app](./img/screenshot-app-main.png) |

## Features

- **Pan & explore** — move the map anywhere in the world; location is detected automatically via reverse geocoding
- **3 AI models** — choose between Nano Banana, Nano Banana 2, and Nano Banana Pro based on speed and quality needs (see [Models](#models))
- **6 art styles** — Watercolor, Vintage, Ink Sketch, Oil Paint, Ancient Ink, Cyberpunk
- **7 aspect ratios** — 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3
- **Postcard back** — a matching decorative back side is generated alongside the front
- **Upload a photo** — add yourself into the scene; the AI redraws you in the postcard's artistic style
- **History** — generated postcards are saved in the current session (cleared on page refresh)
- **Lucky spin** — the compass button picks a random city and style for instant inspiration
- **Cost estimate** — token usage and estimated USD cost displayed after each generation

## Models

| Name | Model ID | Speed | Quality | Free tier |
|------|----------|-------|---------|-----------|
| Nano Banana | `gemini-2.5-flash-image` | Fast | Good | Yes |
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | Fast | Better | Yes |
| Nano Banana Pro | `gemini-3-pro-image-preview` | Slow | Best | No — paid API key required |

> Cost is estimated from token counts × [Google AI published rates](https://ai.google.dev/pricing). Actual billing may differ.

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
> You can enter it directly in the app (bottom-left key icon) — no config files needed.

Alternatively, create a `.env.local` file:

```
GEMINI_API_KEY=your_key_here
```

## Deploy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aryous/PostcardMapAI)

After deploying, add the environment variable in **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini API key (optional — users can also enter their own) |

### CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Connect GitHub (recommended)

1. Push this repo to your GitHub account
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Optionally add `GEMINI_API_KEY` as an environment variable
4. Every push to `main` auto-deploys

## Tech Stack

- **React + TypeScript + Vite**
- **Leaflet** — interactive map
- **Google Gemini API** — multi-model image generation with Nano Banana (`gemini-2.5-flash-image`), Nano Banana 2 (`gemini-3.1-flash-image-preview`), and Nano Banana Pro (`gemini-3-pro-image-preview`)
- **html2canvas** — map screenshot
- **Nominatim** — reverse geocoding (OpenStreetMap)
- **Tailwind CSS** (CDN)

## Known Limitations

- **History is session-only** — generated postcards are lost on page refresh; there is no persistent storage
- **Nano Banana Pro requires a paid API key** — free-tier keys return a 403 error for `gemini-3-pro-image-preview`
- **Map tile CORS** — screenshots depend on tile providers allowing CORS; some custom tile layers may render blank
- **Cost estimates are approximate** — calculated from token counts, not actual billing data from Google

---

<div align="center">
  <sub><a href="https://postcard-map-ai.vercel.app">postcard-map-ai.vercel.app</a></sub>
</div>
