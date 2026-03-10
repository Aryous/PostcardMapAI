export interface StyleDef {
  id: string;
  frontPrompt: string;
  backPrompt: string;
  label: { zh: string; en: string };
}

export const STYLE_DEFS: StyleDef[] = [
  {
    id: 'vintage',
    frontPrompt: 'Medium: 1950s lithograph travel poster with screen print texture. Bold flat colors, visible grain, heavy retro sans-serif typography. Golden hour warm lighting. Map roads rendered as simplified graphic curves.',
    backPrompt: 'Aged yellowed paper with coffee stains and subtle creases. Victorian ornamental border.',
    label: { zh: '复古', en: 'Vintage' }
  },
  {
    id: 'ink',
    frontPrompt: 'Medium: Traditional Chinese ink wash (水墨画) on aged rice paper. Axonometric architectural projection with delicate brush line work. Desaturated palette: sage green, burnt ochre, sepia. Red seal stamps (印章). Atmospheric negative space.',
    backPrompt: 'Aged rice paper texture with natural fiber patterns. Vertical brush-painted divider line.',
    label: { zh: '古韵', en: 'Ancient Ink' }
  },
  {
    id: 'watercolor',
    frontPrompt: 'Medium: Urban sketching watercolor with steel pen line art. Loose wet-on-wet washes, organic color bleeds, unfinished edges. Handwritten calligraphy typography. Soft paper texture visible throughout.',
    backPrompt: 'Cold-press watercolor paper texture. Delicate floral corner ornaments in muted tones.',
    label: { zh: '水彩', en: 'Watercolor' }
  },
  {
    id: 'cyberpunk',
    frontPrompt: 'Medium: Sci-fi digital concept art. Neon-lit night scene with holographic map interface overlaying architecture. Glowing cyan/magenta road networks, rain-slicked reflections. Blade Runner atmosphere with volumetric fog.',
    backPrompt: 'Dark slate digital background with neon cyan grid lines. Holographic UI elements and glitch effects.',
    label: { zh: '赛博朋克', en: 'Cyberpunk' }
  },
  {
    id: 'sketch',
    frontPrompt: 'Medium: Architectural travel journal with graphite pencil and fine-line ink. Faint minimalist street map background (pale pastels, delicate grid lines). Detailed cross-hatched landmark sketches in isometric perspective. High contrast between crisp pencil strokes and soft vintage paper texture.',
    backPrompt: 'Aged parchment paper with subtle staining. Fine ink decorative border.',
    label: { zh: '素描', en: 'Sketch' }
  },
  {
    id: 'oil',
    frontPrompt: 'Medium: Impressionist oil painting with thick impasto texture. Visible palette knife strokes and directional brushwork. Vibrant color vibration with broken color technique. Atmospheric light treatment inspired by Van Gogh and Monet.',
    backPrompt: 'Canvas cloth texture with visible weave. Painted ornamental border in complementary tones.',
    label: { zh: '油画', en: 'Oil Paint' }
  },
];