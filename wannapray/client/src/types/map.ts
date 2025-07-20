export interface FilterState {
  showPrayerRooms: boolean;
  showMultiFaith: boolean;
  showIslamic: boolean;
  showAccessible: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Amenity {
  id: number;
  osmId: string;
  type: 'prayer_room';
  name: string;
  latitude: number;
  longitude: number;
  fee?: boolean;
  wheelchair?: boolean;
  openingHours?: string;
  denomination?: string;
  gender?: string;
  ablutionFacilities?: boolean;
  prayerMats?: boolean;
  qiblaDirection?: boolean;
  quietSpace?: boolean;
  shoesRemoval?: boolean;
  building?: boolean;
  capacity?: number;
  supervisor?: string;
  accessType?: string;
  operator?: string;
  lastUpdated?: string;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}