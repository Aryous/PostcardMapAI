export interface LocationPreset {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const LUCKY_LOCATIONS: LocationPreset[] = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, zoom: 14 },
  { name: 'New York', lat: 40.7128, lng: -74.0060, zoom: 14 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, zoom: 14 },
  { name: 'London', lat: 51.5074, lng: -0.1278, zoom: 14 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, zoom: 14 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, zoom: 14 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, zoom: 14 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, zoom: 14 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, zoom: 14 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, zoom: 14 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, zoom: 14 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734, zoom: 14 },
  { name: '北京', lat: 39.9042, lng: 116.4074, zoom: 14 },
  { name: '上海', lat: 31.2304, lng: 121.4737, zoom: 14 },
  { name: '成都', lat: 30.5728, lng: 104.0668, zoom: 14 },
  { name: '西安', lat: 34.3416, lng: 108.9398, zoom: 14 },
  { name: '桂林', lat: 25.2736, lng: 110.2907, zoom: 13 },
  { name: '丽江', lat: 26.8721, lng: 100.2330, zoom: 14 },
  { name: '厦门', lat: 24.4798, lng: 118.0894, zoom: 14 },
  { name: '重庆', lat: 29.5630, lng: 106.5516, zoom: 14 }
];

export const getRandomLocation = () => {
  return LUCKY_LOCATIONS[Math.floor(Math.random() * LUCKY_LOCATIONS.length)];
};