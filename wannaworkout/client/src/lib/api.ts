export async function fetchWorkoutEquipment(bounds?: string) {
  const url = bounds ? `/api/amenities/workout-equipment?bounds=${bounds}` : '/api/amenities/workout-equipment';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch workout equipment: ${response.status}`);
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