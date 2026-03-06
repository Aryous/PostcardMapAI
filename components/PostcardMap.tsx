
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import ViewfinderOverlay from './ViewfinderOverlay';
import L from 'leaflet';
import { AppState, AspectRatio, Language } from '../types';

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
  language: Language;
}

// Inner component to access map context
const MapEventHandler: React.FC<{
  appState: AppState;
  onMoveEnd: (lat: number, lng: number) => void;
  onMoveStart: () => void;
}> = ({ appState, onMoveEnd, onMoveStart }) => {
  useMapEvents({
    movestart: () => {
      if (appState !== AppState.GENERATING) {
        onMoveStart();
      }
    },
    moveend: (e) => {
      if (appState !== AppState.GENERATING) {
        const c = e.target.getCenter();
        onMoveEnd(c.lat, c.lng);
      }
    },
  });
  return null;
};

const PostcardMap: React.FC<PostcardMapProps> = ({
  appState, aspectRatio, locationName, targetLocation, onMapSelection, language
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

  // Fire initial geocode when map loads
  useEffect(() => {
    if (!initialPosition || appState !== AppState.IDLE) return;
    setIsDetecting(true);
    fetchLocationName(initialPosition[0], initialPosition[1]).then(name => {
      setIsDetecting(false);
      onMapSelection(name);
    });
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
        { headers: { 'Accept-Language': language === 'zh' ? 'zh,en' : 'en,zh' } }
      );
      const data = await response.json();
      if (data?.address) {
        const addr = data.address;
        // Nominatim may return semicolon-separated names (e.g. "大伦敦;Greater London") — take first segment only
        const clean = (s?: string) => s ? s.split(';')[0].trim() : undefined;
        // In zh mode, skip fields that have no CJK characters (untranslated OSM data)
        const prefer = (s?: string) => {
          const v = clean(s);
          if (!v) return undefined;
          if (language === 'zh' && !/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(v)) return undefined;
          return v;
        };
        const name = prefer(addr.tourism) || prefer(addr.historic) || prefer(addr.leisure) ||
          prefer(addr.building) || prefer(addr.amenity) || prefer(addr.park) ||
          prefer(addr.village) || prefer(addr.town) ||
          prefer(addr.city_district) || prefer(addr.city) || prefer(addr.state) ||
          clean(addr.city) || clean(addr.state);
        const city = clean(addr.city);
        let full = name || '';
        if (city && name !== city) full += `, ${city}`;
        else if (addr.country && !full.includes(addr.country)) full += `, ${clean(addr.country)}`;
        return full.replace(/^,\s*/, '') || clean(data.display_name) || '';
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
