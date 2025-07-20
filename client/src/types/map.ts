export interface LatLng {
  lat: number;
  lng: number;
}

export interface SearchLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface MapAmenity {
  id: string;
  osmId: string;
  type: 'bathroom' | 'dog_park' | 'shower' | 'fitness_station' | 'outdoor_gym' | 'swimming_pool' | 'gym' | 'playground';
  name: string;
  latitude: number;
  longitude: number;
  fee?: boolean | null;
  wheelchair?: boolean | null;
  openingHours?: string | null;
  barrier?: string | null;
  offLeash?: boolean | null;
  drinkingWater?: boolean | null;
  dogWasteBins?: boolean | null;
  changingTable?: boolean | null;
  bidet?: boolean | null;
  toiletPaper?: boolean | null;
  handDryer?: boolean | null;
  sanitaryDisposal?: boolean | null;
  selfCleaning?: boolean | null;
  // Shower-specific fields
  hotWater?: boolean | null;
  accessType?: string | null;
  gender?: string | null;
  building?: boolean | null;
  covered?: boolean | null;
  supervised?: boolean | null;
  operator?: string | null;
  // Playground-specific fields
  waterPlay?: boolean | null;
  babyChange?: boolean | null;
  fenced?: boolean | null;
  equipment?: string | null;
  ageGroup?: string | null;
  surfacing?: string | null;
  tags?: Record<string, any>;
}

export interface FilterState {
  showBathrooms?: boolean;
  showDogParks?: boolean;
  showShowers?: boolean;
  showBabyChanging?: boolean;
  showWheelchairAccessible?: boolean;
  showBidet?: boolean;
  showToiletPaper?: boolean;
  showHandDryer?: boolean;
  showSanitaryDisposal?: boolean;
  
  // Fitness filters for WannaWorkOut
  showFitnessStations?: boolean;
  showOutdoorGyms?: boolean;
  showSwimmingPools?: boolean;
  showGyms?: boolean;
  
  // Prayer room filters for WannaPray
  showMosques?: boolean;
  showChurches?: boolean;
  showMultiFaith?: boolean;
  showPrayerRooms?: boolean;
  
  // Playground filters for WannaPlay
  showPlaygrounds?: boolean;
  showToddlerAreas?: boolean;
  
  // Beauty service filters for WannaWax and WannaManiPedi
  showWaxingSalons?: boolean;
  showNailSalons?: boolean;
  showAccessible?: boolean;
  showWaterPlay?: boolean;
  
  // Skate park filters for WannaRoll
  showSkatePark?: boolean;
  showBMX?: boolean;
  showBeginner?: boolean;
  showAdvanced?: boolean;
  
  // Dog park filters for WannaWalktheDog
  showDogParks?: boolean;
  showOffLeash?: boolean;
  showWaterAccess?: boolean;
  showFenced?: boolean;
  
  // Waxing salon filters for WannaWax
  showWaxingSalons?: boolean;
  showHairRemoval?: boolean;
  showBodyWax?: boolean;
  showFacialWax?: boolean;
  
  // Nail salon filters for WannaManiPedi
  showNailSalons?: boolean;
  showManicures?: boolean;
  showPedicures?: boolean;
  showNailArt?: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface MarkerData {
  amenity: MapAmenity;
  distance?: number;
}

export interface Review {
  id: number;
  amenityId: number;
  userNickname: string;
  cleanlinessRating: number;
  hasToiletPaper: boolean | null;
  hasMirror: boolean | null;
  hasHotWaterSoap: boolean | null;
  hasSoap: boolean | null;
  hasSanitaryDisposal: boolean | null;
  handDryerType: 'electric' | 'paper' | 'none' | null;
  photoUrl: string | null;
  comments: string | null;
  createdAt: Date | null;
}

export interface ReviewFormData {
  amenityId: number;
  userNickname: string;
  cleanlinessRating: number;
  hasToiletPaper: boolean | null;
  hasMirror: boolean | null;
  hasHotWaterSoap: boolean | null;
  hasSoap: boolean | null;
  hasSanitaryDisposal: boolean | null;
  handDryerType: 'electric' | 'paper' | 'none' | null;
  comments: string;
  photo: File | null;
  contactInfo?: string;
  contactType?: 'whatsapp' | 'telegram' | 'signal' | 'sms' | null;
}
