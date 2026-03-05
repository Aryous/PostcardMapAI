
import html2canvas from 'html2canvas';

export const captureMapElement = async (elementId: string): Promise<string> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  try {
    // Leaflet uses transforms that might mess up html2canvas, and we need CORS support for tiles
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true, 
      logging: false,
      ignoreElements: (node) => {
        // Ignore geoman toolbar and drawn shapes (selection artifacts)
        return node.classList.contains('leaflet-control-container') ||
               node.classList.contains('leaflet-overlay-pane');
      }
    });

    // OPTIMIZATION:
    // html2canvas creates a canvas at screen resolution. On retina displays (pixelRatio=2 or 3),
    // this creates massive images (e.g. 3000x2000) which generate huge Base64 strings (10MB+).
    // This causes Gemini API to 500 or timeout. 
    // We resize it to a reasonable max dimension (e.g., 1024px) which is plenty for structure guidance.
    
    const maxDim = 1024;
    let width = canvas.width;
    let height = canvas.height;
    
    // Check if resize is needed
    if (width > maxDim || height > maxDim) {
       const scale = Math.min(maxDim / width, maxDim / height);
       const tempCanvas = document.createElement('canvas');
       tempCanvas.width = width * scale;
       tempCanvas.height = height * scale;
       const ctx = tempCanvas.getContext('2d');
       if (ctx) {
           // Use better quality scaling if available
           ctx.imageSmoothingEnabled = true;
           ctx.imageSmoothingQuality = 'high';
           ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
           // Return JPEG at 85% quality to drastically reduce size compared to PNG
           return tempCanvas.toDataURL('image/jpeg', 0.85); 
       }
    }
    
    // Default to JPEG compression even if no resize, as PNG is too heavy for base64 payloads
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (error) {
    console.error("Map capture failed:", error);
    throw new Error("Failed to capture map image. Ensure map tiles allow cross-origin access.");
  }
};
