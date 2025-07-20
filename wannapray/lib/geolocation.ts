import { UserLocation } from "@/types/map";

export class GeolocationError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export function getCurrentPosition(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking geolocation support...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      reject(new GeolocationError('Geolocation is not supported by this browser'));
      return;
    }

    console.log('✅ Geolocation supported, requesting position...');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 60000 // Reduced cache time
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Position received:', position.coords);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let message = 'Unable to get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services in your browser.';
            console.error('Permission denied for geolocation');
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            console.error('Position unavailable');
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            console.error('Geolocation timeout');
            break;
        }
        
        reject(new GeolocationError(message, error.code));
      },
      options
    );
  });
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function getDirectionsUrl(userLat: number, userLng: number, destLat: number, destLng: number): string {
  return `https://www.google.com/maps/dir/${userLat},${userLng}/${destLat},${destLng}/@${destLat},${destLng},16z/data=!3m1!4b1!4m2!4m1!3e2`;
}
