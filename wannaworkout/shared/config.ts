// Global configuration for WannaWorkOut - Public Workout Equipment Finder

export const APP_NAME = "WannaWorkOut";

export function getAppTitle(): string {
  return APP_NAME;
}

// Default city configuration (can be overridden for deployment)
export const DEFAULT_CITY = {
  name: "Global",
  code: "GLOBAL", 
  center: [0, 0] as const,
  bounds: {
    southwest: [-90, -180] as const,
    northeast: [90, 180] as const
  }
};

export const CURRENT_CITY = DEFAULT_CITY;

// Sample locations for search suggestions (global major cities with parks)
export const globalLocations = [
  { name: 'New York City', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 }
] as const;