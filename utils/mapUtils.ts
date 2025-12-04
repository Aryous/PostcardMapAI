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
      allowTaint: true, // Try to allow tainted canvas if necessary (though strictly it blocks data extraction, useCORS is safer)
      logging: false,
      ignoreElements: (node) => {
        // Ignore the geoman controls or UI overlays if they are inside the map div
        return node.classList.contains('leaflet-control-container');
      }
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Map capture failed:", error);
    throw new Error("Failed to capture map image. Ensure map tiles allow cross-origin access.");
  }
};
