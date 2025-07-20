// Debug script to test direct Overpass queries
const axios = require('axios');

async function testOverpassQuery() {
  const query = `
    [out:json][timeout:25];
    (
      nwr[~"^(leisure|sport|amenity)$"~"^(fitness|exercise|gym).*$"](-37.85,144.95,-37.82,144.97);
      nwr["leisure"="fitness_station"](-37.85,144.95,-37.82,144.97);
      nwr["amenity"="exercise_equipment"](-37.85,144.95,-37.82,144.97);
      nwr[fitness_station](-37.85,144.95,-37.82,144.97);
      nwr[exercise](-37.85,144.95,-37.82,144.97);
    );
    out geom;
  `;

  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' }
    });
    
    console.log('Found elements:', response.data.elements.length);
    response.data.elements.forEach((element, index) => {
      console.log(`${index + 1}. ID: ${element.id}, Type: ${element.type}`);
      console.log('   Tags:', JSON.stringify(element.tags, null, 2));
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOverpassQuery();