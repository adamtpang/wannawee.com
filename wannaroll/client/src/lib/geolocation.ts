import { UserLocation } from "@/types/map";

export function getCurrentPosition(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking geolocation support...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported by this browser');
      reject(new Error('Geolocation not supported'));
      return;
    }

    console.log('✅ Geolocation supported, requesting position...');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Position received:', position.coords);
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        resolve(location);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
}