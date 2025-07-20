export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Amenity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'playground' | 'park' | 'recreation';
  
  // Playground-specific features
  ageGroup?: 'toddler' | 'children' | 'mixed'; // Under 12 focus
  equipment?: string[]; // swings, slides, climbing, sandbox, etc.
  surfacing?: 'grass' | 'rubber' | 'sand' | 'bark' | 'concrete';
  fenced?: boolean;
  shaded?: boolean;
  restrooms?: boolean;
  parking?: boolean;
  waterPlay?: boolean;
  accessible?: boolean;
  
  // Additional info
  operator?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
}

export interface FilterState {
  showPlaygrounds: boolean;
  showToddlerAreas: boolean;
  showAccessible: boolean;
  showWaterPlay: boolean;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}