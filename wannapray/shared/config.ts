// Global configuration for WannaPray - Prayer Room Finder

export const APP_NAME = "WannaPray";

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

// Sample locations for search suggestions (global major cities)
export const globalLocations = [
  { name: 'New York City', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Mecca', lat: 21.3891, lng: 39.8579 },
  { name: 'Medina', lat: 24.5247, lng: 39.5692 },
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137 }
] as const;