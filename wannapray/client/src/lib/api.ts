export async function fetchPrayerRooms(bounds?: string) {
  const url = bounds ? `/api/amenities/prayer-rooms?bounds=${bounds}` : '/api/amenities/prayer-rooms';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch prayer rooms: ${response.status}`);
  }
  return response.json();
}

export async function searchLocations(query: string, language: string = 'en') {
  const response = await fetch(`/api/search/locations?q=${encodeURIComponent(query)}&lang=${language}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  return response.json();
}