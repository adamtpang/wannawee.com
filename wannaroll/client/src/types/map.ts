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
  type: 'skate_park' | 'bmx' | 'roller_sports';
  
  // Skate park specific features
  skateParkType?: 'street' | 'vert' | 'bowl' | 'mixed';
  features?: string[]; // rails, ramps, bowls, halfpipe, mini_ramp, etc.
  surface?: 'concrete' | 'wood' | 'metal' | 'mixed';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  lighting?: boolean;
  covered?: boolean;
  restrooms?: boolean;
  parking?: boolean;
  waterFountain?: boolean;
  
  // Additional info
  operator?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
  fee?: boolean;
}

export interface FilterState {
  showSkatePark: boolean;
  showBMX: boolean;
  showBeginner: boolean;
  showAdvanced: boolean;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}