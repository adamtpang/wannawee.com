import { apiRequest } from "./queryClient";

export class OverpassError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OverpassError';
  }
}

export async function fetchBathrooms() {
  try {
    const response = await apiRequest('GET', '/api/amenities/bathrooms');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch bathrooms:', error);
    throw new OverpassError('Failed to load bathroom data. Please check your internet connection.');
  }
}

export async function fetchDogParks() {
  try {
    const response = await apiRequest('GET', '/api/amenities/dog-parks');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dog parks:', error);
    throw new OverpassError('Failed to load dog park data. Please check your internet connection.');
  }
}

export async function fetchShowers() {
  try {
    const response = await apiRequest('GET', '/api/amenities/showers');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch showers:', error);
    throw new OverpassError('Failed to load shower data. Please check your internet connection.');
  }
}

// Global data fetching functions
export async function fetchBathroomsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/bathrooms/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch bathrooms for bounds:', error);
    throw new OverpassError('Failed to load bathroom data for this location.');
  }
}

export async function fetchDogParksForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/dog-parks/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dog parks for bounds:', error);
    throw new OverpassError('Failed to load dog park data for this location.');
  }
}

export async function fetchShowersForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/showers/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch showers for bounds:', error);
    throw new OverpassError('Failed to load shower data for this location.');
  }
}

export async function searchLocations(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Use Nominatim (OpenStreetMap's geocoding service) for global search
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Wanna-Wee-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Search request failed');
    }
    
    const data = await response.json();
    
    // Transform Nominatim results to our format
    const results = data.map((result: any) => ({
      name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    }));
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}
