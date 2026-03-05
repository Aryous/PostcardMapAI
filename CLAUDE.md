# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**MapPostcard AI** — 用户在 Leaflet 地图上框选区域，应用截图地图并调用 Gemini API，将其转化为艺术风格明信片（正面 + 背面）。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 构建生产版本
npm run build
```

**环境变量**：在根目录创建 `.env.local`，写入：
```
GEMINI_API_KEY=your_key_here
```
Vite 将其注入为 `process.env.API_KEY`（见 `vite.config.ts`）。

## 架构

### 核心状态机

`App.tsx` 是整个应用的控制中心，以 `AppState` 枚举驱动 UI 流转：

```
IDLE → DRAWING → REVIEWING → GENERATING → COMPLETE
```

- **IDLE**：初始/重置后状态
- **DRAWING**：用户在地图上框选中（GeomanControl 激活）
- **REVIEWING**：框选完成，触发 Nominatim 反向地理编码，等待用户生成
- **GENERATING**：调用 Gemini API 中（前后面并发生成）
- **COMPLETE**：图片生成成功，展示结果

### 生成流水线（`handleGenerate` in `App.tsx`）

1. **截图**：`captureMapElement('map-container')` — html2canvas 截取地图，限制 1024px + JPEG 压缩，防止 Gemini API payload 过大
2. **并发生成**：`Promise.all([generatePostcard(), generatePostcardBack()])` — 正面（地图风格化）和背面（postcard 模板）同时请求
3. **费用统计**：合并两次请求的 token 计数，按 `PRICING` 常量估算 USD 费用

### 关键文件

| 文件 | 职责 |
|------|------|
| `services/geminiService.ts` | 所有 Gemini API 调用；含 3 种 prompt 模式（default/V2/custom）和定价计算 |
| `components/PostcardMap.tsx` | Leaflet 地图 + Nominatim 反向地理编码；`id="map-container"` 供截图使用 |
| `components/GeomanControl.tsx` | Leaflet-Geoman 绘图工具栏（react-leaflet hook 组件，返回 null） |
| `components/ControlPanel.tsx` | 左侧控制面板；**`STYLE_DEFS` 从此文件导出**，供 LuckyDice 随机使用 |
| `utils/mapUtils.ts` | html2canvas 封装；含 Retina 屏缩放逻辑 |
| `utils/translations.ts` | 中英文 i18n 字符串（`TRANSLATIONS['zh'/'en']`） |

### Gemini Prompt 三种模式（`geminiService.ts`）

- **Default**：简单 prompt，适合快速生成
- **V2**（`devConfig.useV2Prompt`）：严格地图贴合模式，要求 AI 将道路/街区一一对应到地图线条
- **Custom**（`devConfig.useCustomPrompt`）：自定义系统指令，style prompt 作为补充追加

### 开发者模式

连续点击标题 5 次激活，存储在 `localStorage('map_postcard_dev_mode')`。激活后可：
- 手动编辑识别到的地点名称
- 切换 V2 Prompt
- 输入自定义系统指令

### 样式系统

- **Tailwind**：通过 CDN 加载（`index.html`），**不是** PostCSS/npm 包，无需 `tailwind.config.js`
- **自定义 CSS**：3D 翻转动画、信封动效、骰子动效等均在 `index.html` 的 `<style>` 块内定义
- Leaflet/Geoman CSS 通过 `index.html` 的 `<link>` CDN 引入

### 历史记录

最多保存 5 条，存于 `localStorage('postcard_history')`。每条记录含正面图、背面图、styleId、model、cost。

## 注意事项

- `gemini-3-pro-image-preview` 模型需要付费 API Key，且依赖 `window.aistudio?.openSelectKey()` — 这是 AI Studio 平台特有的 API，本地开发时此模型会报 403
- Leaflet 默认图标在 React 中会加载失败，`PostcardMap.tsx` 顶部有手动修复（指向 unpkg CDN）
- `html2canvas` 截图需要地图瓦片允许 CORS（`crossOrigin={true}` 已设置在 TileLayer）；截图时故意延迟 800ms 等待瓦片渲染完成
- 新增 Style 时，需同步更新 `ControlPanel.tsx` 的 `STYLE_DEFS`、`translations.ts` 的 `styles` 字段（zh + en 各一处）、`geminiService.ts` 的 `generatePostcardBack` switch 分支
