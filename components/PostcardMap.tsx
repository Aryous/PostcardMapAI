
import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import GeomanControl from './GeomanControl';
import L from 'leaflet';
import { AppState } from '../types';

// Fix Leaflet's default icon issue in React
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PostcardMapProps {
  appState: AppState;
  targetLocation?: { lat: number, lng: number, zoom: number };
  onMapSelection: (detectedName: string) => void;
}

const PostcardMap: React.FC<PostcardMapProps> = ({ appState, targetLocation, onMapSelection }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInitialPosition([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setInitialPosition([51.505, -0.09]); // Default London
        }
      );
    } else {
      setInitialPosition([51.505, -0.09]);
    }
  }, []);

  // Handle flyTo when targetLocation changes
  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom, {
        duration: 2.5,
        easeLinearity: 0.25
      });
    }
  }, [targetLocation]);

  const fetchLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'en,zh' } } // Request mixed language support
      );
      const data = await response.json();
      
      if (data && data.address) {
        // Prioritize meaningful landmark/district names
        const addr = data.address;
        const name = addr.tourism || addr.historic || addr.leisure || addr.building || addr.amenity || addr.park || addr.village || addr.town || addr.city_district || addr.city || addr.state;
        
        // Construct a clean name, e.g., "The Palace Museum, Beijing"
        let fullName = name || "";
        if (addr.city && name !== addr.city) {
            fullName += `, ${addr.city}`;
        } else if (addr.country && !fullName.includes(addr.country)) {
            fullName += `, ${addr.country}`;
        }
        
        return fullName.replace(/^,\s*/, '') || data.display_name || ""; // Remove leading comma
      }
      return "";
    } catch (error) {
      console.warn("Reverse geocoding failed", error);
      return "";
    }
  };

  const handleShapeCreated = async (e: any) => {
    const layer = e.layer;
    let center = { lat: 0, lng: 0 };

    if (layer.getBounds) {
        const bounds = layer.getBounds();
        center = bounds.getCenter();
        if (mapRef.current) {
            mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
        }
    } else if (layer.getLatLng) {
        center = layer.getLatLng();
    }

    // Pass an empty string first to indicate "loading" if needed, 
    // but better to just wait for the fetch
    const detectedName = await fetchLocationName(center.lat, center.lng);
    
    // Notify parent with the detected name
    onMapSelection(detectedName);
  };

  const handleShapeDeleted = () => {
     // Handled by parent
  };

  if (!initialPosition) return null;

  return (
    <div id="map-container" className="h-full w-full relative z-0">
      <MapContainer
        center={initialPosition}
        zoom={13}
        className="h-full w-full outline-none"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin={true}
        />
        <GeomanControl 
          onShapeCreated={handleShapeCreated} 
          onShapeDeleted={handleShapeDeleted}
        />
      </MapContainer>
    </div>
  );
};

export default PostcardMap;
