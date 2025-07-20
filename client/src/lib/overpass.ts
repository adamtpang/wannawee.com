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

// Fitness facility fetch functions
export async function fetchFitnessStations() {
  try {
    const response = await apiRequest('GET', '/api/amenities/fitness-stations');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch fitness stations:', error);
    throw new OverpassError('Failed to load fitness station data. Please check your internet connection.');
  }
}

export async function fetchFitnessStationsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/fitness-stations/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch fitness stations for bounds:', error);
    throw new OverpassError('Failed to load fitness station data for this location.');
  }
}

export async function fetchOutdoorGyms() {
  try {
    const response = await apiRequest('GET', '/api/amenities/outdoor-gyms');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch outdoor gyms:', error);
    throw new OverpassError('Failed to load outdoor gym data. Please check your internet connection.');
  }
}

export async function fetchOutdoorGymsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/outdoor-gyms/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch outdoor gyms for bounds:', error);
    throw new OverpassError('Failed to load outdoor gym data for this location.');
  }
}

export async function fetchSwimmingPools() {
  try {
    const response = await apiRequest('GET', '/api/amenities/swimming-pools');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch swimming pools:', error);
    throw new OverpassError('Failed to load swimming pool data. Please check your internet connection.');
  }
}

export async function fetchSwimmingPoolsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/swimming-pools/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch swimming pools for bounds:', error);
    throw new OverpassError('Failed to load swimming pool data for this location.');
  }
}

export async function fetchGyms() {
  try {
    const response = await apiRequest('GET', '/api/amenities/gyms');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch gyms:', error);
    throw new OverpassError('Failed to load gym data. Please check your internet connection.');
  }
}

export async function fetchGymsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/gyms/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch gyms for bounds:', error);
    throw new OverpassError('Failed to load gym data for this location.');
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

// Playground fetch functions for WannaPlay
export async function fetchPlaygrounds() {
  try {
    const response = await apiRequest('GET', '/api/amenities/playgrounds');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch playgrounds:', error);
    throw new OverpassError('Failed to load playground data. Please check your internet connection.');
  }
}

export async function fetchPlaygroundsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/playgrounds/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch playgrounds for bounds:', error);
    throw new OverpassError('Failed to load playground data for this location.');
  }
}

// Prayer room fetch functions for WannaPray
export async function fetchMosques() {
  try {
    const response = await apiRequest('GET', '/api/amenities/mosques');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch mosques:', error);
    throw new OverpassError('Failed to load mosque data. Please check your internet connection.');
  }
}

export async function fetchChurches() {
  try {
    const response = await apiRequest('GET', '/api/amenities/churches');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch churches:', error);
    throw new OverpassError('Failed to load church data. Please check your internet connection.');
  }
}

export async function fetchPrayerRooms() {
  try {
    const response = await apiRequest('GET', '/api/amenities/prayer-rooms');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch prayer rooms:', error);
    throw new OverpassError('Failed to load prayer room data. Please check your internet connection.');
  }
}

export async function fetchMosquesForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/mosques/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch mosques for bounds:', error);
    throw new OverpassError('Failed to load mosque data for this location.');
  }
}

export async function fetchChurchesForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/churches/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch churches for bounds:', error);
    throw new OverpassError('Failed to load church data for this location.');
  }
}

export async function fetchPrayerRoomsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/prayer-rooms/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch prayer rooms for bounds:', error);
    throw new OverpassError('Failed to load prayer room data for this location.');
  }
}

// Skate park fetch functions for WannaRoll
export async function fetchSkateParks() {
  try {
    const response = await apiRequest('GET', '/api/amenities/skate-parks');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch skate parks:', error);
    throw new OverpassError('Failed to load skate park data. Please check your internet connection.');
  }
}

export async function fetchBMXTracks() {
  try {
    const response = await apiRequest('GET', '/api/amenities/bmx-tracks');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch BMX tracks:', error);
    throw new OverpassError('Failed to load BMX track data. Please check your internet connection.');
  }
}

export async function fetchSkateParksForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/skate-parks/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch skate parks for bounds:', error);
    throw new OverpassError('Failed to load skate park data for this location.');
  }
}

export async function fetchBMXTracksForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/bmx-tracks/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch BMX tracks for bounds:', error);
    throw new OverpassError('Failed to load BMX track data for this location.');
  }
}

// Waxing salon fetch functions for WannaWax
export async function fetchWaxingSalons() {
  try {
    const response = await apiRequest('GET', '/api/amenities/waxing-salons');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch waxing salons:', error);
    throw new OverpassError('Failed to load waxing salon data. Please check your internet connection.');
  }
}

export async function fetchWaxingSalonsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/waxing-salons/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch waxing salons for bounds:', error);
    throw new OverpassError('Failed to load waxing salon data for this location.');
  }
}

// Nail salon fetch functions for WannaManiPedi
export async function fetchNailSalons() {
  try {
    const response = await apiRequest('GET', '/api/amenities/nail-salons');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch nail salons:', error);
    throw new OverpassError('Failed to load nail salon data. Please check your internet connection.');
  }
}

export async function fetchNailSalonsForBounds(swLat: number, swLng: number, neLat: number, neLng: number) {
  try {
    const response = await apiRequest('GET', `/api/amenities/nail-salons/bounds?swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch nail salons for bounds:', error);
    throw new OverpassError('Failed to load nail salon data for this location.');
  }
}
