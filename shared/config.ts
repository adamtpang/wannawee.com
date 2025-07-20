// Configuration for different city deployments
export interface CityConfig {
  cityName: string;
  cityCode: string;
  center: [number, number]; // [latitude, longitude]
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  searchLocations: Array<{
    name: string;
    lat: number;
    lng: number;
  }>;
}

// Current city configuration - San Francisco
export const CURRENT_CITY: CityConfig = {
  cityName: "San Francisco",
  cityCode: "SF",
  center: [37.7749, -122.4194],
  bounds: {
    south: 37.7049,
    west: -122.5161,
    north: 37.8349,
    east: -122.3549
  },
  searchLocations: [
    { name: "Mission District", lat: 37.7599, lng: -122.4148 },
    { name: "Castro", lat: 37.7609, lng: -122.4350 },
    { name: "Haight-Ashbury", lat: 37.7694, lng: -122.4469 },
    { name: "Chinatown", lat: 37.7941, lng: -122.4078 },
    { name: "Financial District", lat: 37.7946, lng: -122.3999 },
    { name: "Union Square", lat: 37.7880, lng: -122.4074 },
    { name: "Fisherman's Wharf", lat: 37.8080, lng: -122.4177 },
    { name: "Golden Gate Park", lat: 37.7694, lng: -122.4862 },
    { name: "Lombard Street", lat: 37.8021, lng: -122.4187 },
    { name: "Alcatraz Island", lat: 37.8267, lng: -122.4233 },
    { name: "Coit Tower", lat: 37.8024, lng: -122.4058 },
    { name: "Dolores Park", lat: 37.7576, lng: -122.4276 },
    { name: "SoMa", lat: 37.7749, lng: -122.4194 },
    { name: "North Beach", lat: 37.8067, lng: -122.4102 },
    { name: "Presidio", lat: 37.7989, lng: -122.4662 }
  ]
};

// App branding
export const APP_NAME = "Wanna Wee";
export const getAppTitle = () => APP_NAME;
export const getPageTitle = () => `${getAppTitle()} - Find Bathrooms & Dog Parks`;

// Future city configurations can be added here
// export const LONDON_CONFIG: CityConfig = { ... };
// export const NYC_CONFIG: CityConfig = { ... };