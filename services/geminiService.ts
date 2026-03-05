
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
You are a master travel postcard artist. Create a hand-drawn watercolor illustration postcard
for "${locationName}". Every creative decision—composition, color, text—must be specific to
this place and impossible to replicate for anywhere else.

## STYLE
**Medium**: ${userPrompt}
Muted, soft color palette (cream, beige, pale blues, sage greens, sepia, earth tones).
Visible pen strokes, organic watercolor washes, aged paper texture, intentional imperfections.

${cleanUserBase64 ? `**USER PHOTO — REDRAW ONLY, DO NOT COMPOSITE**:
Use the photo as a drawing reference only. REDRAW the person from scratch in the same
watercolor illustration style—never paste, filter, or composite the photo directly.
The location is always "${locationName}" from the map, never from the photo's background.
` : ''}
## MAP
Use the provided map as a faint base layer (20-35% opacity). Street grids and topographic
lines become artistic texture. Map text should be illegible—whispered geography, not signage.
Landmarks sit naturally atop the map geography, grounded to their real locations.

## LANDMARKS
Draw 2-5 iconic landmarks or cultural symbols of "${locationName}". Use detailed line art
with selective watercolor fills. Vary scale for depth. Research the location's actual
architectural style, flora, and cultural details.

## HUMAN FIGURES (if included)
Figures MUST be fully redrawn in the same watercolor illustration style as the landmarks—
same line quality, same muted palette, same paper texture. Never photorealistic or vector.
Place figures on the map's streets/terrain. Preserve 20-30% negative space.

## TYPOGRAPHY ⭐
**Language**: Chinese (书法体/宋体) for Chinese locations; English script/serif for international.

**Location title**: Gradient fill with 60°+ hue shift (e.g., Gold→Rose Gold, Teal→Coral).
Watercolor texture overlay, outer glow. Position: top-center or integrated into composition.

**Poetic tagline**: Capture the unique soul of this place—never generic.
- Chinese: Use classical phrases if they exist ("桂林山水甲天下"), cultural nicknames
  (春城/泉城/冰城), or a concise original expression. Avoid "美丽的城市", "繁华都市".
- International: Use a culturally authentic epithet ("The Eternal City") or specific
  thematic slogan. Avoid "Beautiful", "Amazing", "City of Dreams".

**Postmark**: "[城市名] 中国" or "[CITY] [COUNTRY]", semi-transparent (30-50% opacity).

## POSTCARD ELEMENTS
Top-right: postage stamp with mini landmark illustration, perforated edge, slight rotation.
Optional: circular postmark overlapping stamp, decorative corner flourishes.

## FINISHING
Aged paper grain, subtle watercolor bleeds, atmospheric perspective (distant = lighter).
Organic imperfections: brush strokes visible, edges slightly rough, occasional color drips.

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
