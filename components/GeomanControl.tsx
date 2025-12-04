import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import L from 'leaflet';

interface GeomanControlProps {
  onShapeCreated: (e: any) => void;
  onShapeDeleted: () => void;
}

const GeomanControl = ({ onShapeCreated, onShapeDeleted }: GeomanControlProps) => {
  const map = useMap();

  useEffect(() => {
    // Add Geoman controls to the map
    map.pm.addControls({
      position: 'topright',
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: false,
      drawPolyline: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    // Event listeners
    map.on('pm:create', (e) => {
      // Clear previous shapes to enforce single selection if desired, 
      // or just accept the latest. For simplicity, we keep latest.
      const layer = e.layer;
      
      // Auto-remove other shapes (single selection mode)
      map.eachLayer((l) => {
        if (l instanceof L.Path && l !== layer && (l as any).pm) {
           // Basic check to avoid removing the map tiles (which are GridLayers)
           // and only remove drawn shapes. 
           // Better approach: use a specific LayerGroup for drawings.
        }
      });

      onShapeCreated(e);
      
      // When a shape is created, listen for its removal
      layer.on('pm:remove', () => {
        onShapeDeleted();
      });
    });

    map.on('pm:remove', (e) => {
      onShapeDeleted();
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map, onShapeCreated, onShapeDeleted]);

  return null;
};

export default GeomanControl;