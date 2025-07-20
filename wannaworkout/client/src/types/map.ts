export interface FilterState {
  showWorkoutEquipment: boolean;
  showOutdoorGym: boolean;
  showFitnessStations: boolean;
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
  type: 'fitness_station' | 'outdoor_gym' | 'calisthenics' | 'playground';
  name: string;
  latitude: number;
  longitude: number;
  fee?: boolean;
  wheelchair?: boolean;
  openingHours?: string;
  equipmentType?: string;
  material?: string;
  covered?: boolean;
  lighting?: boolean;
  surface?: string;
  ageGroup?: string;
  difficulty?: string;
  multipleStations?: boolean;
  parkingNearby?: boolean;
  drinkingWater?: boolean;
  restrooms?: boolean;
  operator?: string;
  manufacturer?: string;
  lastUpdated?: string;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}