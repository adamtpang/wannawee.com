import { useState, useEffect } from "react";
import Map from "@/components/Map";
import SearchBar from "@/components/SearchBar";
import FilterControls from "@/components/FilterControls";
import InfoPanel from "@/components/InfoPanel";
import { FilterState, UserLocation, Amenity } from "@/types/map";
import { getCurrentPosition } from "@/lib/geolocation";

export default function MapPage() {
  // Loading screen state
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Initialize filters - all amenities visible by default
  const [filters, setFilters] = useState<FilterState>({
    showPrayerRooms: true,
    showMultiFaith: true,
    showIslamic: true,
    showAccessible: true,
  });
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const handleLocationSelect = (location: any) => {
    setSearchLocation({ lat: location.lat, lng: location.lng });
  };

  const handleUserLocationFound = (location: UserLocation) => {
    setUserLocation(location);
  };

  const handleMarkerClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
  };

  const handleCloseInfoPanel = () => {
    setSelectedAmenity(null);
  };

  const handleLanguageDetected = (detectedLanguage: string) => {
    if (detectedLanguage !== currentLanguage) {
      console.log(`🔄 Language change detected: ${currentLanguage} → ${detectedLanguage}`);
      setCurrentLanguage(detectedLanguage);
    }
  };

  // Auto-detect user location on app load
  useEffect(() => {
    const getInitialLocation = async () => {
      console.log('🌍 Starting geolocation detection...');
      try {
        const location = await getCurrentPosition();
        console.log('📍 Location detected:', location);
        setUserLocation(location);
        console.log('✅ Location set successfully');
      } catch (error) {
        console.error('❌ Geolocation failed:', error);
        setSearchLocation({ lat: 37.7749, lng: -122.4194 });
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getInitialLocation();
  }, []);

  // Loading screen
  if (isLoadingLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">WannaPray - Finding prayer rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <Map
        filters={filters}
        userLocation={userLocation}
        searchLocation={searchLocation}
        onMarkerClick={handleMarkerClick}
        language={currentLanguage}
      />
      
      <SearchBar
        onLocationSelect={handleLocationSelect}
        onLanguageDetected={handleLanguageDetected}
        language={currentLanguage}
      />
      
      <FilterControls
        filters={filters}
        onFiltersChange={setFilters}
        onLocateMe={() => {
          getCurrentPosition().then(handleUserLocationFound).catch(console.error);
        }}
        language={currentLanguage}
      />
      
      {selectedAmenity && (
        <InfoPanel
          amenity={selectedAmenity}
          onClose={handleCloseInfoPanel}
          userLocation={userLocation}
        />
      )}
    </div>
  );
}