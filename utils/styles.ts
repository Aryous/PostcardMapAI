export interface StyleDef {
  id: string;
  frontPrompt: string;
  backPrompt: string;
  label: { zh: string; en: string };
}

// REFACTORED STYLE DEFINITIONS: Focus on Medium, Mood, and Lighting.
export const STYLE_DEFS: StyleDef[] = [
  {
    id: 'vintage',
    frontPrompt: 'Style: 1950s Travel Poster. Medium: Lithograph / Screen Print. Features: Bold flat colors, grain texture, heavy retro typography header, nostalgic golden hour lighting. The map roads become charming winding streets.',
    backPrompt: 'Aged yellowed paper texture with coffee stains. Antique victorian border.',
    label: { zh: '复古', en: 'Vintage' }
  },
  {
    id: 'ink',
    frontPrompt: 'Style: Traditional Chinese "Shan-Shui" & Architectural Art. Medium: Ink wash on aged Rice Paper. Features: Axonometric projection, delicate line work, desaturated earth tones (sage, ochre), red seal stamps. Atmospheric and poetic.',
    backPrompt: 'Aged rice paper texture. Vertical divider line painted with brush.',
    label: { zh: '古韵', en: 'Ancient Ink' }
  },
  {
    id: 'watercolor',
    frontPrompt: 'Style: Urban Sketching / Plein Air. Medium: Watercolor & Ink. Features: Loose wet-on-wet washes, paint splatters, unfinished edges, handwritten calligraphy typography. Dreamy, airy, and artistic.',
    backPrompt: 'Clean white cold-press watercolor paper texture. Soft floral corners.',
    label: { zh: '水彩', en: 'Watercolor' }
  },
  {
    id: 'cyberpunk',
    frontPrompt: 'Style: Sci-Fi Concept Art. Medium: Digital Painting. Features: Neon-soaked night, holographic map interface overlaying real city structures, glowing road networks, rain reflections, "Blade Runner" atmosphere.',
    backPrompt: 'Dark digital slate background. Neon blue grid lines. Holographic elements.',
    label: { zh: '赛博朋克', en: 'Cyberpunk' }
  },
  {
    id: 'sketch',
    frontPrompt: 'Style: Renaissance Architectural Study. Medium: Sepia Ink & Graphite on Parchment. Features: Detailed cross-hatching, construction lines, technical annotations, Da Vinci aesthetic. Precision meets art.',
    backPrompt: 'Rough sketchbook paper texture. Charcoal pencil lines.',
    label: { zh: '素描', en: 'Sketch' }
  },
  {
    id: 'oil',
    frontPrompt: 'Style: Impressionist Masterpiece. Medium: Oil on Canvas. Features: Thick impasto texture (palette knife), visible brush strokes, vibrant light vibration, emotional landscape. Like a Van Gogh or Monet painting.',
    backPrompt: 'Canvas cloth texture background. Elegant painted border.',
    label: { zh: '油画', en: 'Oil Paint' }
  },
];
