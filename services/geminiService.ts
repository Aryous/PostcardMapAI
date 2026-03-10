
import { GoogleGenAI } from "@google/genai";
import { DevConfig, UsageStats, GenerationResult } from "../types";

const getClient = () => {
  const apiKey = sessionStorage.getItem('gemini_api_key') || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure your Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

// Pricing Constants (Per 1 Million Tokens)
// Based on Google AI published rates (https://ai.google.dev/pricing).
// The Gemini API does not return billing data in response metadata,
// so all displayed costs are estimates calculated from token counts × rate.
const PRICING = {
  'gemini-2.5-flash-image': {
    input: 0.075,
    output: 0.30
  },
  'gemini-3.1-flash-image-preview': {
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
Act as a Visionary Graphic Architect specializing in artistic travel postcards. Your task is to craft a "Geographic Love Letter" that seamlessly weaves together cartography, cultural landmarks, and poetic expression into a museum-quality keepsake.


═══════════════════════════════════════════════════════════════

## CORE PHILOSOPHY

Create a postcard that captures the UNIQUE SOUL of "${locationName}" through the artistic lens of hand-drawn illustration. Every element—from map treatment to text expression to human figures—should be tailored to THIS specific place, not follow a rigid template.

Think like an artist, a poet, and a cultural observer. Your goal is to create something that could only represent THIS location—impossible to replicate for anywhere else.

═══════════════════════════════════════════════════════════════

## 1. ARTISTIC MEDIUM & FOUNDATION

${userPrompt}

═══════════════════════════════════════════════════════════════

## 2. CARTOGRAPHIC FOUNDATION (Flexible Treatment)

**The map is NOT a static background—it's a living element of the composition.**

**Approach Options** (choose based on location character):

**Option A: Atmospheric Background** (most common)
- Map as a subtle, low-opacity foundation (20-35% opacity)
- Topographic lines, street grids, or coastlines create texture
- Map elements can fade into watercolor washes
- Landmarks and illustrations sit naturally atop the geography

**Option B: Map as Primary Subject** (for geographically distinctive locations)
- Map takes center stage with bold, artistic rendering
- Topographic features become decorative patterns
- Illustrated elements emerge organically from map features
- Example: A nature reserve where rivers and trails form the main visual structure

**Option C: Abstract Geographic Foundation**
- Map elements abstracted into flowing lines and shapes
- Geography suggested rather than literally depicted
- Creates a sense of place without precise cartographic accuracy

**Map Styling**:
- Line weight: Delicate and varied (thinner for minor roads, slightly thicker for coastlines/borders)
- Text on map: Artistic and illegible—treat place names as textural elements, not readable labels
  - Apply artistic blur, very low opacity (10-25%), or watercolor dissolve effect
  - Map text should feel like whispered geography, not clear signage
- Color: Muted earth tones, sepia, or soft blues—never harsh black
- Integration: Allow map lines to organically blend with illustrated elements

═══════════════════════════════════════════════════════════════

## 3. CULTURAL LANDMARKS & ILLUSTRATED ELEMENTS

**Selection Principle**: Choose 2-5 iconic landmarks or cultural symbols that define "${locationName}"

**Rendering Style**:
- Detailed line art with selective watercolor fills
- Architectural accuracy balanced with artistic interpretation
- Visible pen strokes and hatching for texture and depth
- Soft shadows using diluted watercolor technique (not hard drop shadows)

**Composition Integration**:
- Landmarks should feel "rooted" in the map, not floating stickers
- Vary scale to create depth: larger elements in foreground, smaller in background
- Allow elements to overlap naturally
- Consider asymmetric arrangements for visual interest

**Cultural Authenticity**:
- Research location-specific architectural details, flora, fauna, or cultural symbols
- For natural locations: Include native plants, wildlife, or geological features
- For urban locations: Capture architectural style and city character
- For historical sites: Reflect the era and cultural significance

═══════════════════════════════════════════════════════════════

## 4. HUMAN PRESENCE
${cleanUserBase64 ? `
**USER PHOTO — REDRAW ONLY, DO NOT COMPOSITE**:
A traveler photo is provided. REDRAW the person from scratch in the same hand-drawn
illustration style as the landmarks—never paste, filter, or composite the photo directly.
The location is always "${locationName}" from the map, never from the photo's background.

**Style Integration**:
- Same artistic technique and medium as landmarks and map
- Same muted color palette and paper texture
- Organic, imperfect edges (not digital-perfect)
- Avoid photorealism, vector art, or style mixing
- The figure must look hand-drawn and indistinguishable from the illustrated landmarks

**Positioning**:
- Foreground Protagonist (30-50% of frame): Half-body or 3/4 body portrait
- Creates "looking into the scene" perspective
- Figure grounded ON the map's streets/terrain, not floating
- Allow partial overlap with landmarks for depth

**Preserve 20-30% negative space.**
` : `
❌ NO HUMAN FIGURES. Do not include any people, silhouettes, or human forms in this postcard.
Focus entirely on landmarks, architecture, geography, and cultural symbols.
`}

═══════════════════════════════════════════════════════════════

## 5. TYPOGRAPHY & TEXT CONTENT (Creative Freedom)

### **Language Selection** ⭐ CREATIVE FREEDOM

**Core Principle**: Use the language that authentically represents the location's cultural identity.

**For Chinese locations** (China, Hong Kong, Macau, Taiwan):
- **Primary language**: Chinese (简体中文 for mainland China)
- **Creative approach**: Think like a Chinese poet or calligrapher
  - Observe the place's unique essence in Chinese cultural context
  - Express it naturally—not through formulas or templates
  - Can use classical references if they exist (e.g., "桂林山水甲天下")
  - Can use cultural nicknames if appropriate (e.g., "春城" for Kunming)
  - Can create new expressions if they genuinely capture something unique
  - Can be minimal—sometimes just the city name is enough (e.g., "大同")
  - Avoid generic praise (美丽的城市, 繁华都市) or forced formulas

- **Bilingual option** (optional, not mandatory):
  - Can include both Chinese and English if it serves the design
  - Example: "大同 DATONG" or "杭州 HANGZHOU"
  - Use only if it enhances communication, not as a default rule

- **Typography for Chinese text**:
  - Font: Elegant calligraphy (书法体) or clean modern fonts (宋体/黑体)
  - Chinese characters can be slightly larger than equivalent English text for visual balance
  - Gradient treatment works beautifully with Chinese characters

**For international locations**:
- **Primary language**: English (or local language + English)
- Follow the same creative freedom principles as outlined below

---

### **Primary Title (Location Identifier)**

**Content**:
- **For Chinese locations**: City/region name in Chinese (e.g., "大同", "桂林", "北京")
- **For international locations**: City/region name in English or local language (e.g., "PARIS", "ROMA", "TOKYO")

**Position**: Top-center, top-left, or integrated into composition

**Font Style**:
- **For Chinese**: Elegant calligraphy (书法体) or artistic hand-lettering
- **For English**: Flowing script, elegant serif, or artistic hand-lettering

**Visual Treatment**:
- **Mandatory gradient fill**: Dramatic color transition with minimum 60-degree hue shift
  - Example: Gold (RGB 218,165,32) → Rose Gold (RGB 183,110,121)
  - Example: Teal (RGB 0,128,128) → Coral (RGB 255,127,80)
  - Example: Deep Blue → Purple → Warm Orange (for more dramatic effect)
- Outer glow or soft shadow for depth
- Watercolor texture overlay for organic feel
- Text should feel like part of the artwork, not a digital overlay

---

### **Secondary Text: Poetic Expression** ⭐ CREATIVE FREEDOM ZONE

**Core Principle**:
Capture the UNIQUE SOUL of "${locationName}" through authentic expression. Avoid generic descriptions that could apply to any location.

**Language Rule**: Match the primary title language
- **Chinese locations** → Chinese poetic expression
- **International locations** → English poetic expression

---

#### **For Chinese Locations - Poetic Expression**

**Creative Process**:

1. **Observe the location's essence**:
   - What defines THIS place in Chinese culture?
   - Does it have a famous classical reference or poem?
   - What's its relationship with nature, history, or culture?
   - What makes it impossible to confuse with another city?

2. **Authentic Examples** (understand WHY they work, don't copy the pattern):

   ✦ "桂林山水甲天下" (Guilin)
     → Why it works: This is THE classical phrase for Guilin—culturally embedded, instantly recognizable
     → Not a template: You can't apply this structure to other cities

   ✦ "云冈石韵" (Datong)
     → Why it works: Captures the essence of Yungang Grottoes (stone + rhythm/charm)
     → Not a formula: It's specific to Datong's stone carving heritage

   ✦ "古都新韵" (Beijing/Xi'an)
     → Why it works: Expresses the tension between ancient capital status and modern vitality
     → Not generic: Only works for cities with imperial history

   ✦ "江南水乡" (Suzhou/Hangzhou region)
     → Why it works: Describes the defining characteristic of Jiangnan region—water towns
     → Not universal: Can't be used for northern or mountain cities

   ✦ "春城" (Kunming)
     → Why it works: This is Kunming's established cultural nickname (City of Eternal Spring)
     → Not invented: It's a recognized epithet

3. **What to AVOID**:
   - Generic praise: "美丽的城市", "繁华都市", "魅力之城"
   - Forced four-character phrases that sound artificial
   - Modern advertising slogans that lack cultural depth
   - Direct translation of English phrases into Chinese

4. **What to DO**:
   - If a classical phrase exists (like "桂林山水甲天下"), use it—don't reinvent
   - If the city has a cultural nickname (春城, 泉城, 冰城, 山城), consider using it
   - Create NEW expressions only when they genuinely capture something unique
   - Use natural Chinese rhythm (2-character, 4-character, or 5-7 character phrases)
   - Can be poetic, can be descriptive, can be minimal—whatever fits the place
   - Sometimes just the city name is enough: "杭州" (let the art speak)

5. **Tone Guidance**:
   - Ancient cities → Emphasize historical depth, classical references
   - Natural landscapes → Emphasize harmony with nature, poetic imagery
   - Modern cities → Can balance tradition with contemporary energy
   - Cultural sites → Reference specific cultural elements, not generic beauty

---

#### **For International Locations - Poetic Expression**

**Creative Process**:

1. **Observe the location's defining characteristic**:
   - What makes THIS place different from anywhere else?
   - Is there a tension, harmony, or story here?
   - Does it have a famous cultural nickname or epithet?

2. **Expression approaches** (choose what fits naturally):

   **A. Thematic Slogan** (when location has a distinctive feature)
   - Capture the essence through poetic observation
   - Example: "Where Nature Meets the City" (Singapore's Central Catchment—urban jungle sanctuary)
   - Example: "Where Mountains Rise Like Brushstrokes" (Guilin's ink-wash landscape)
   - Must be SPECIFIC to this place—impossible to apply elsewhere

   **B. Cultural Epithet** (when location has iconic nickname)
   - Use established cultural identity
   - Example: "The Eternal City" (Rome's 2,800-year history)
   - Example: "Greetings from the Big Apple" (NYC's colloquial identity)
   - Must be culturally authentic, not invented

   **C. Traditional Greeting** (when location lacks distinctive character)
   - Simple, classic postcard format
   - Example: "Greetings From [Location Name]"
   - Use only if above approaches don't naturally fit

   **D. Minimal/None** (when visual narrative is strong)
   - Location name only, no additional text
   - Let the artwork speak for itself
   - Best for map-focused or highly artistic designs

3. **What to AVOID**:
   - Generic adjectives: "Beautiful", "Amazing", "Wonderful City"
   - Template phrases: "City of Dreams", "Land of Beauty" (unless culturally specific)
   - Forced poetic structures that don't match the place's character
   - Clichés that could describe anywhere

4. **Tone Guidance by Location Type**:
   - Natural reserves in urban areas → Nature-city contrast
   - Ancient cities → Timelessness, historical depth
   - Modern metropolises → Energy, innovation, dynamism
   - Cultural crossroads → Fusion, diversity, harmony
   - Coastal/island locations → Water-land relationship
   - Mountain regions → Elevation, majesty, earth-sky connection

---

**Typography for Secondary Text**:
- Font: Clean sans-serif or refined serif (contrast with primary title)
- Size: Smaller than primary title (subordinate hierarchy)
- Position: Below primary title OR bottom-center
- Color: Harmonizes with overall palette
- Treatment: Subtle, not competing with primary title

---

### **Postmark Text**

**For Chinese locations**:
- Format: "[城市名] 中国" or "[区县名] 中国"
- Example: "大同市 中国", "平城区 中国", "北京 中国", "桂林 中国"
- Font: Clean Chinese font (宋体/黑体), semi-transparent (30-50% opacity)

**For international locations**:
- Format: "[CITY NAME] [COUNTRY]"
- Example: "PARIS FRANCE", "ROME ITALY", "TOKYO JAPAN"
- Font: Clean sans-serif, semi-transparent (30-50% opacity)

═══════════════════════════════════════════════════════════════

## 6. COMPOSITION & VISUAL HIERARCHY

**Negative Space**: Reserve 20-30% of composition as breathing room
- Allows intricate details to shine
- Prevents visual clutter
- Creates sophisticated, gallery-worthy aesthetic

**Layered Depth**:
- Background: Map foundation with soft, muted treatment
- Midground: Primary landmarks and illustrated elements
- Foreground: Human figures (if included), title text, decorative flourishes

**Compositional Flexibility** (choose based on content):
- **Classic Centered**: Symmetrical landmark arrangement, title at top
- **Organic Flow**: Elements follow map's natural geography (rivers, coastlines)
- **Collage Style**: Multiple vignettes or viewpoints within one composition
- **Map-Focused**: Geography as hero, illustrations as accents
- **Human-Centered**: Foreground figure as protagonist, landmarks as backdrop

**Visual Balance**:
- Distribute visual weight across the composition
- Use scale variation to create focal points
- Allow some elements to break the frame edge for dynamism
- When including human figures, balance their visual weight with landmarks

═══════════════════════════════════════════════════════════════

## 7. POSTCARD-SPECIFIC ELEMENTS

**Postage Stamp** (Top-right corner):
- **Design**: Mini illustration of a key landmark or cultural symbol from the location
- **Style**: Matches overall hand-drawn aesthetic with perforated edge effect
- **Size**: Approximately 15-20% of postcard height
- **Treatment**: Slight rotation (2-5 degrees) for authentic postage feel
- **Border**: Vintage stamp border with subtle aging/texture

**Postmark** (Optional, overlapping stamp):
- Circular postmark with location name and date
- Faded, semi-transparent (30-50% opacity)
- Adds authenticity and vintage charm
- Text follows language rule (Chinese for Chinese locations, English for international)

**Decorative Border** (Optional):
- Subtle frame or corner flourishes
- Hand-drawn ornamental elements
- Should enhance, not overpower the composition

═══════════════════════════════════════════════════════════════

## 8. TEXTURE & FINISHING TOUCHES

**Unified Texture Layer**:
- Apply subtle paper grain across entire composition
- Slight color variation and aging effects (cream to light sepia tones)
- Watercolor edge effects where elements meet
- Occasional "happy accidents": small drips, blooms, or color bleeds

**Depth & Dimension**:
- Soft shadows using diluted watercolor technique
- Atmospheric perspective: distant elements lighter and less saturated
- Overlapping elements to create spatial relationships

**Authenticity Details**:
- Visible brush strokes and pen lines
- Slight color variations within solid areas
- Organic, imperfect edges (not digital-perfect)
- Texture that suggests physical media (paper, ink, watercolor)

═══════════════════════════════════════════════════════════════

## 9. FINAL QUALITY STANDARDS

**Museum-Quality Aesthetic**:
- Composition worthy of framing and display
- Timeless design that transcends trends
- Cultural respect and authenticity
- Artistic integrity over commercial clichés

**Collectible Appeal**:
- Each postcard should feel unique to its location
- Attention to detail that rewards close viewing
- Emotional resonance—captures not just what a place looks like, but what it FEELS like
- Human presence (when included) adds warmth and relatability

**Technical Excellence**:
- Balanced color harmony
- Clear visual hierarchy
- Professional typography
- Cohesive style throughout
- Seamless integration of all elements (map, landmarks, figures, text)

═══════════════════════════════════════════════════════════════

## FINAL DELIVERABLE

A breathtaking, hand-crafted postcard that serves as a "Geographic Love Letter" to "${locationName}"—where the map whispers the geography, the illustrations celebrate the culture, the text captures the soul, and human presence (when included) invites emotional connection and tells a story of discovery.

**Remember**:

You are NOT filling a template.

You are NOT choosing from a menu of options.

You ARE creating a unique artistic interpretation of a specific place.

Think like a poet observing the world.
Think like an artist capturing a moment.
Think like a cultural insider expressing love for a place.
Think like a storyteller weaving human experience into geography.

Let the location's character guide EVERY creative decision—from language choice to composition, from color palette to text expression, from landmark selection to human presence.

Create something that could ONLY represent THIS place, and nowhere else in the world.

When you include human figures, make them feel like they BELONG in this artistic world—not as photographic inserts, but as natural inhabitants of the hand-drawn landscape, rendered with the same love and care as every brushstroke and pen line.` }




    // Pass the aspect ratio directly as requested
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (modelName === 'gemini-3-pro-image-preview' || modelName === 'gemini-3.1-flash-image-preview') {
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

    if (modelName === 'gemini-3-pro-image-preview' || modelName === 'gemini-3.1-flash-image-preview') {
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
