
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import ViewfinderOverlay from './ViewfinderOverlay';
import L from 'leaflet';
import { AppState, AspectRatio } from '../types';

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
  aspectRatio: AspectRatio;
  locationName: string;
  targetLocation?: { lat: number, lng: number, zoom: number };
  onMapSelection: (detectedName: string) => void;
}

// Inner component to access map context
const MapEventHandler: React.FC<{
  appState: AppState;
  onMoveEnd: (lat: number, lng: number) => void;
  onMoveStart: () => void;
}> = ({ appState, onMoveEnd, onMoveStart }) => {
  useMapEvents({
    movestart: () => {
      if (appState !== AppState.GENERATING && appState !== AppState.COMPLETE) {
        onMoveStart();
      }
    },
    moveend: (e) => {
      if (appState !== AppState.GENERATING && appState !== AppState.COMPLETE) {
        const c = e.target.getCenter();
        onMoveEnd(c.lat, c.lng);
      }
    },
  });
  return null;
};

const PostcardMap: React.FC<PostcardMapProps> = ({
  appState, aspectRatio, locationName, targetLocation, onMapSelection
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setInitialPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setInitialPosition([51.505, -0.09])
      );
    } else {
      setInitialPosition([51.505, -0.09]);
    }
  }, []);

  // Fire initial onMapSelection when map loads (puts app into REVIEWING state)
  useEffect(() => {
    if (initialPosition && appState === AppState.IDLE) {
      onMapSelection('');
    }
  }, [initialPosition]);

  // flyTo when targetLocation changes
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'en,zh' } }
      );
      const data = await response.json();
      if (data?.address) {
        const addr = data.address;
        const name = addr.tourism || addr.historic || addr.leisure || addr.building ||
          addr.amenity || addr.park || addr.village || addr.town ||
          addr.city_district || addr.city || addr.state;
        let full = name || '';
        if (addr.city && name !== addr.city) full += `, ${addr.city}`;
        else if (addr.country && !full.includes(addr.country)) full += `, ${addr.country}`;
        return full.replace(/^,\s*/, '') || data.display_name || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  const handleMoveStart = useCallback(() => {
    setIsDetecting(true);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
  }, []);

  const handleMoveEnd = useCallback(async (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const name = await fetchLocationName(lat, lng);
      setIsDetecting(false);
      onMapSelection(name);
    }, 800);
  }, [onMapSelection]);

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
        <MapEventHandler
          appState={appState}
          onMoveStart={handleMoveStart}
          onMoveEnd={handleMoveEnd}
        />
      </MapContainer>

      <ViewfinderOverlay
        aspectRatio={aspectRatio}
        locationName={locationName}
        isDetecting={isDetecting}
        appState={appState}
        mapCenter={mapCenter}
      />
    </div>
  );
};

export default PostcardMap;
