
import { GoogleGenAI } from "@google/genai";
import { DevConfig, UsageStats, GenerationResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// Pricing Constants (Per 1 Million Tokens)
// Based on approximate public pricing for Gemini 1.5 tiers as proxy for 2.5/3.0
const PRICING = {
  'gemini-2.5-flash-image': {
    input: 0.075,
    output: 0.30
  },
  'gemini-3-pro-image-preview': {
    input: 3.50,
    output: 10.50
  }
};

const calculateCost = (model: string, promptTokens: number, candidatesTokens: number): UsageStats => {
  const rates = PRICING[model as keyof typeof PRICING] || PRICING['gemini-2.5-flash-image'];

  const inputCost = (promptTokens / 1_000_000) * rates.input;
  const outputCost = (candidatesTokens / 1_000_000) * rates.output;

  return {
    promptTokens,
    candidatesTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD'
  };
};

export const generatePostcard = async (
  mapImageBase64: string,
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  userImageBase64?: string,
  aspectRatio: string = '4:3',
  devConfig?: DevConfig,
  locationName: string = ""
): Promise<GenerationResult> => {
  try {
    const ai = getClient();

    const cleanMapBase64 = mapImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const cleanUserBase64 = userImageBase64 ? userImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "") : null;

    let systemInstruction = "";

    const hasLocationName = locationName && locationName.trim().length > 0;
    const locationContext = hasLocationName ? `The location is "${locationName}".` : "The specific location name is unknown, so deduce the vibe from the map structure itself.";
    const typographyRule = hasLocationName
      ? `3. TYPOGRAPHY: You MUST artistically integrate the text "${locationName}" into the image. It should look like a professional poster title.`
      : `3. TYPOGRAPHY: Do NOT add specific location text if you don't know it. You may add generic artistic text like "Greetings" or "Travel" ONLY if it fits the style, otherwise keep it text-free.`;

    if (devConfig?.useCustomPrompt && devConfig.customSystemInstruction) {
      // Append the style instructions to the custom prompt so the style buttons still work
      systemInstruction = `${devConfig.customSystemInstruction}\n\nSPECIFIC STYLE INSTRUCTIONS:\n${userPrompt}`;

      if (!cleanUserBase64) {
        systemInstruction += `\n\n人物限制：当前没有提供人物照片，请不要在画面中添加任何人物形象。`;
      }

      if (hasLocationName) {
        systemInstruction += `\n\nLOCATION CONTEXT:\n${locationName}`;
      }
    }
    else if (devConfig?.useV2Prompt) {
      systemInstruction = `
        ROLE: Master Cartographic Artist & Postcard Designer.

        TASK:
        You are provided with a [Map Image]. Your job is to COLOR and TEXTURIZE this map to turn it into an art piece.
        
        CRITICAL INSTRUCTION - MAP INTEGRATION:
        - The [Map Image] is your WIREFRAME / LINE ART.
        - DO NOT HALLUCINATE NEW GEOGRAPHY.
        - TRACE the roads: They must become streets/canals/paths in the final image.
        - TRACE the blocks: They must become buildings/forests/parks.
        - The goal is that if I overlay the original map on your output, the streets would ALIGN.

        DESIGN & COMPOSITION:
        1. PERSPECTIVE: Maintain the top-down or slightly tilted (isometric) view of the map. Do not change it to a street-level photo.
        2. CONTEXT: ${locationContext} Use architectural styles relevant to this context.
        ${typographyRule}
        4. USER INTEGRATION: (If User Photo is provided) The user is the traveler standing IN this map world (e.g., standing on one of the map's streets), looking at the scenery.

        ARTISTIC STYLE:
        ${userPrompt}

        CONSTRAINTS:
        - FULL BLEED. Fill the canvas.
        - NO MAP UI. Turn pins/buttons into trees or bushes.
        - High fidelity textures.
        
        ${cleanUserBase64 ? `
        USER PHOTO INSTRUCTION:
        - A photo of the user is provided. 
        - REDRAW the person into the scene. 
        - Match lighting and style.
        ` : ''}

        Output ONLY the raw image file content.
       `;
    }
    else {
      systemInstruction = `
Act as a Visionary Graphic Architect specializing in artistic travel postcards.
Create a "Geographic Love Letter" that captures the unique soul of "${locationName}"
through hand-drawn watercolor illustration.

═══════════════════════════════════════════════════════════════

## CORE PHILOSOPHY

Think like an artist, a poet, and a cultural observer—NOT a template filler.

Every element should be tailored to THIS specific place, impossible to replicate
for anywhere else. Let the location's character guide EVERY creative decision.

═══════════════════════════════════════════════════════════════

## 1. ARTISTIC STYLE

**Visual Medium**: ${userPrompt}

**Key Characteristics**:
- Visible pen strokes with organic line variation
- Soft watercolor washes with natural color bleeding
- Paper texture throughout (cream/beige/aged paper grain)
- Intentional imperfections: line wobbles, uneven saturation
- Non-photorealistic, celebrates the artist's hand

**Color Palette**:
- Soft, muted tones: cream, beige, pale blues, sage greens, dusty rose, sepia, earth tones
- Low saturation, avoid pure whites and saturated primaries
- Colors blend organically at edges with subtle variations

${cleanUserBase64 ? `**USER PHOTO — REFERENCE ONLY, DO NOT COMPOSITE**:
A photo of the traveler is provided as a DRAWING REFERENCE. Your task is to REDRAW this person completely from scratch as a hand-drawn illustration—NOT to paste, composite, or filter the photo.
- ❌ DO NOT paste the photo into the composition
- ❌ DO NOT apply filters or style transfer to the photo
- ✅ USE the photo only to identify: face features, clothing, hair, and approximate pose
- ✅ REDRAW the person entirely in the same watercolor illustration style as the rest of the postcard
- ✅ The final figure must look HAND-DRAWN—indistinguishable from the illustrated landmarks
- ✅ The location is always defined by "${locationName}" and the map—IGNORE any background from the photo
` : ''}
═══════════════════════════════════════════════════════════════

## 2. MAP FOUNDATION (Flexible Treatment)

**Core Principle**: The map is a living element, not a static background.

**Choose approach based on location character**:

**A. Atmospheric Background** (most common)
- Low-opacity foundation (20-35%)
- Topographic lines/street grids create subtle texture
- Landmarks sit naturally atop geography

**B. Map as Primary Subject** (for geographically distinctive locations)
- Bold artistic rendering of topographic features
- Geography becomes the main visual structure
- Illustrated elements emerge from map features

**C. Abstract Geographic Foundation**
- Map abstracted into flowing lines and shapes
- Geography suggested rather than literal

**Map Styling**:
- Delicate, varied line weights
- Map text: Artistic and illegible (10-25% opacity)—treat as texture, not readable labels
- Colors: Muted earth tones, sepia, soft blues—never harsh black
- Allow map lines to blend organically with illustrated elements

═══════════════════════════════════════════════════════════════

## 3. CULTURAL LANDMARKS

**Selection**: 2-5 iconic landmarks or cultural symbols specific to "${locationName}"

**Rendering**:
- Detailed line art with selective watercolor fills
- Architectural accuracy balanced with artistic interpretation
- Visible pen strokes and hatching for texture
- Soft shadows using diluted watercolor (not hard drop shadows)

**Integration**:
- Landmarks grounded in map geography, not floating stickers
- Vary scale for depth: larger in foreground, smaller in background
- Allow natural overlapping
- Research location-specific architectural/natural/cultural details

═══════════════════════════════════════════════════════════════

## 4. HUMAN PRESENCE (Optional) ⭐

**Core Rule**: When included, figures MUST match the hand-drawn watercolor style exactly.

### Style Integration:
- Same pen line art + watercolor technique as landmarks
- Same muted color palette and paper texture
- Organic, imperfect edges (not digital-perfect)
- Avoid photorealism, vector art, or style mixing

### Positioning:
**Foreground Protagonist** (30-50% of frame):
- Half-body or 3/4 body portrait
- Creates "looking into the scene" perspective
- Example: Tourist with camera, traveler sketching

**Mid-ground Participants** (15-25% each):
- Full-body figures integrated into street scene
- 2-4 figures for visual rhythm
- Example: Couples walking, groups exploring

**Background Silhouettes** (5-10%):
- Tiny figures establishing scale
- Distant pedestrians, figures on walls/bridges

### Narrative Roles:
- **Observer**: Holding camera, gazing at landmarks, contemplative
- **Documenter**: Sketching, writing, capturing memories
- **Local**: Natural daily activities, at home in the scene
- **Wanderer**: Walking, exploring, in motion

### Cultural Context:
**For Chinese locations**:
- Modern casual travel wear (most common)
- Activities: Photographing heritage sites, walking ancient streets
- Natural, respectful engagement with cultural landmarks

**For International locations**:
- Clothing reflects local climate and urban style
- Activities: Sightseeing, enjoying local atmosphere
- Authentic gestures, not staged poses

### Color & Integration:
- Skin tones: Warm beige, peachy cream, soft ochre (watercolor-style)
- Clothing: Harmonizes with palette—soft blues, muted greens, earth tones
- Figures grounded ON map's streets/terrain, not floating
- Allow partial overlap with landmarks for depth

### Quantity:
- **1 figure**: Intimate, personal narrative
- **2-3 figures**: Social, relational warmth
- **4-6 figures**: Lively, bustling atmosphere

**Preserve 20-30% negative space even with multiple figures.**

═══════════════════════════════════════════════════════════════

## 5. TYPOGRAPHY & TEXT ⭐ CRITICAL

### Language Selection (Intelligent Matching):

**For Chinese locations** (China, Hong Kong, Macau, Taiwan):
- **Primary language**: Chinese (简体中文 for mainland China)
- **Typography**: Elegant calligraphy (书法体) or clean modern fonts (宋体/黑体)

**For international locations**:
- **Primary language**: English (or local language + English)
- **Typography**: Flowing script, elegant serif, or artistic hand-lettering

---

### Primary Title (Location Identifier):

**Content**:
- Chinese locations: "大同", "桂林", "北京"
- International: "PARIS", "LONDON", "TOKYO"

**Visual Treatment**:
- **Mandatory gradient fill**: Minimum 60-degree hue shift
  - Example: Gold → Rose Gold, Teal → Coral, Deep Blue → Purple → Orange
- Outer glow or soft shadow for depth
- Watercolor texture overlay
- Position: Top-center, top-left, or integrated into composition

---

### Secondary Text (Poetic Expression) ⭐ CREATIVE FREEDOM:

**Core Principle**: Capture the UNIQUE SOUL of this location. Avoid generic descriptions.

**Language Rule**: Match primary title language
- Chinese locations → Chinese expression
- International locations → English expression

---

#### For Chinese Locations:

**Creative Process**:
1. Observe: What defines THIS place in Chinese culture?
2. Research: Does it have a classical phrase or cultural nickname?
3. Express: Capture its unique essence naturally

**Authentic Examples** (understand WHY they work):
- "桂林山水甲天下" (Guilin) → Classical phrase, culturally embedded
- "云冈石韵" (Datong) → Specific to stone carving heritage
- "古都新韵" (Beijing/Xi'an) → Ancient capital + modern vitality
- "江南水乡" (Suzhou/Hangzhou) → Defining regional characteristic
- "春城" (Kunming) → Established cultural nickname

**What to DO**:
- Use classical phrases if they exist—don't reinvent
- Use cultural nicknames if appropriate (春城, 泉城, 冰城, 山城)
- Create NEW expressions only when genuinely unique
- Natural Chinese rhythm (2-character, 4-character, or 5-7 character)
- Can be minimal—sometimes just city name is enough

**What to AVOID**:
- Generic praise: "美丽的城市", "繁华都市", "魅力之城"
- Forced four-character phrases that sound artificial
- Modern advertising slogans lacking cultural depth

---

#### For International Locations:

**Expression Approaches** (choose what fits naturally):

**A. Thematic Slogan** (distinctive feature):
- "Where Nature Meets the City" (Singapore)
- Must be SPECIFIC to this place only

**B. Cultural Epithet** (iconic nickname):
- "The Eternal City" (Rome)
- "Greetings from the Big Apple" (NYC)
- Must be culturally authentic, not invented

**C. Traditional Greeting** (no distinctive character):
- "Greetings From [Location Name]"
- Use only if above approaches don't fit

**D. Minimal/None** (strong visual narrative):
- Location name only, let artwork speak

**What to AVOID**:
- Generic adjectives: "Beautiful", "Amazing", "Wonderful City"
- Template phrases: "City of Dreams", "Land of Beauty"
- Clichés that could describe anywhere

---

### Postmark Text:

**Chinese locations**: "[城市名] 中国"
- Example: "大同市 中国", "桂林 中国", "北京 中国"

**International locations**: "[CITY NAME] [COUNTRY]"
- Example: "PARIS FRANCE", "LONDON UK", "TOKYO JAPAN"

Font: Clean sans-serif or Chinese font (宋体/黑体), semi-transparent (30-50% opacity)

═══════════════════════════════════════════════════════════════

## 6. COMPOSITION & HIERARCHY

**Negative Space**: Reserve 20-30% as breathing room

**Layered Depth**:
- Background: Map foundation (subtle, muted)
- Midground: Landmarks and architecture
- Foreground: Human figures (if included), title text, decorative elements

**Compositional Flexibility** (choose based on content):
- Classic Centered: Symmetrical landmark arrangement
- Organic Flow: Elements follow map's natural geography
- Collage Style: Multiple vignettes or viewpoints
- Map-Focused: Geography as hero, illustrations as accents
- Human-Centered: Foreground figure as protagonist

**Visual Balance**:
- Distribute visual weight across composition
- Use scale variation to create focal points
- Allow some elements to break frame edge for dynamism

═══════════════════════════════════════════════════════════════

## 7. POSTCARD ELEMENTS

**Postage Stamp** (Top-right corner):
- Mini illustration of key landmark/cultural symbol
- Hand-drawn style with perforated edge effect
- 15-20% of postcard height
- Slight rotation (2-5 degrees) for authenticity

**Postmark** (Optional, overlapping stamp):
- Circular with location name and date
- Semi-transparent (30-50% opacity)
- Follows language rule (Chinese for Chinese locations, English for international)

**Decorative Border** (Optional):
- Subtle frame or corner flourishes
- Hand-drawn ornamental elements
- Should enhance, not overpower

═══════════════════════════════════════════════════════════════

## 8. FINISHING TOUCHES

**Unified Texture**:
- Subtle paper grain across entire composition
- Slight aging effects (cream to light sepia tones)
- Watercolor edge effects where elements meet
- Occasional organic "accidents": drips, blooms, color bleeds

**Depth & Atmosphere**:
- Soft shadows using diluted watercolor technique
- Atmospheric perspective: distant = lighter, less saturated
- Overlapping elements for spatial relationships

**Authenticity**:
- Visible brush strokes and pen lines
- Slight color variations within solid areas
- Organic, imperfect edges (not digital-perfect)

═══════════════════════════════════════════════════════════════

## FINAL DELIVERABLE

A museum-quality postcard that serves as a "Geographic Love Letter" to "${locationName}"—
where the map whispers geography, illustrations celebrate culture, text captures soul,
and human presence (when included) invites emotional connection.

**Remember**:
- Language matches location culture (Chinese for China, English for international)
- Text captures unique essence (not generic templates)
- All elements share hand-drawn watercolor style
- Human figures are natural inhabitants, not digital overlays
- Let location's character guide EVERY decision

Create something that could ONLY represent THIS place, and nowhere else in the world.
` }




    // Pass the aspect ratio directly as requested
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (modelName === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = "1K";
    }

    const parts: any[] = [
      { text: systemInstruction },
      {
        inlineData: {
          mimeType: 'image/png',
          data: cleanMapBase64
        }
      }
    ];

    if (cleanUserBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanUserBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    let resultImage = "";
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          resultImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) {
      throw new Error("No image generated by the model.");
    }

    // Extract Usage Metadata
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
    const stats = calculateCost(
      modelName,
      usage.promptTokenCount || 0,
      usage.candidatesTokenCount || 0
    );

    return { imageUrl: resultImage, usage: stats };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generatePostcardBack = async (
  backPrompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  aspectRatio: string = '4:3'
): Promise<GenerationResult | null> => {
  try {
    const ai = getClient();

    const styleDetails = backPrompt;

    // Pass the aspect ratio directly as requested
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (modelName === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = "1K";
    }

    const prompt = `
      Generate a FLAT, 2D GRAPHIC DESIGN TEXTURE for the BACK side of a postcard.
      Full Bleed. No 3D perspective.
      Visual Style: ${styleDetails}
      Elements: Divider line, address lines, stamp box.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
      config: config
    });

    let resultImage = "";
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          resultImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) return null;

    // Extract Usage Metadata
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
    const stats = calculateCost(
      modelName,
      usage.promptTokenCount || 0,
      usage.candidatesTokenCount || 0
    );

    return { imageUrl: resultImage, usage: stats };

  } catch (error) {
    console.error("Back generation failed:", error);
    return null;
  }
}
