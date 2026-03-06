
export interface GenerationStatus {
  isGenerating: boolean;
  error?: string;
  resultImage?: string; // Base64 or URL
}

export interface MapRegion {
  bounds: any; // Leaflet LatLngBounds
  center: { lat: number; lng: number };
}

export enum AppState {
  IDLE = 'IDLE',
  DRAWING = 'DRAWING',
  REVIEWING = 'REVIEWING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE'
}

export type Language = 'en' | 'zh';

export type ModelType = 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  backImageUrl?: string;
  timestamp: number;
  styleId: string;
  model: ModelType;
  cost?: UsageStats;
  locationName?: string;
  aspectRatio?: AspectRatio;
}

export interface DevConfig {
  useCustomPrompt: boolean;
  customSystemInstruction: string;
  useV2Prompt: boolean; // Toggle for the new "Strict No Border" prompt logic
}

export interface UsageStats {
  promptTokens: number;
  candidatesTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export interface GenerationResult {
  imageUrl: string;
  usage: UsageStats;
}
