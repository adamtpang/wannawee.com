import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Map from "@/components/Map";
import SearchBar from "@/components/SearchBar";
import FilterControls from "@/components/FilterControls";
import InfoPanel from "@/components/InfoPanel";
import { FilterState, UserLocation, MarkerData, SearchLocation } from "@/types/map";
import { getCurrentPosition } from "@/lib/geolocation";

interface UnifiedMapPageProps {
  appType: string;
  onBackToSelector: () => void;
}

export default function UnifiedMapPage({ appType, onBackToSelector }: UnifiedMapPageProps) {
  const { user, isAuthenticated } = useAuth();
  
  const getAppTitle = (appId: string) => {
    const titles = {
      'wannawee': 'WannaWee',
      'wannapray': 'WannaPray', 
      'wannaworkout': 'WannaWorkOut',
      'wannaplay': 'WannaPlay',
      'wannaroll': 'WannaRoll',
      'wannawalkthedog': 'WannaWalktheDog',
      'wannawax': 'WannaWax',
      'wannamanipedi': 'WannaManiPedi'
    };
    return titles[appId] || 'Wanna Suite';
  };

  // Initialize filters based on app type
  const getInitialFilters = (appType: string): FilterState => {
    switch (appType) {
      case 'wannawee':
        return {
          showBathrooms: true,
          showBabyChanging: false,
          showWheelchairAccessible: false,
          showBidet: false,
          showToiletPaper: false,
          showHandDryer: false,
          showSanitaryDisposal: false
        };
      case 'wannapray':
        return {
          showMosques: true,
          showChurches: true,
          showMultiFaith: true,
          showPrayerRooms: true
        } as FilterState;
      case 'wannaworkout':
        return {
          showFitnessStations: true,
          showOutdoorGyms: true,
          showSwimmingPools: true,
          showGyms: true,
          showShowers: true
        } as FilterState;
      case 'wannaplay':
        return {
          showPlaygrounds: true,
          showToddlerAreas: true,
          showAccessible: false,
          showWaterPlay: false
        } as FilterState;
      case 'wannaroll':
        return {
          showSkatePark: true,
          showBMX: true,
          showBeginner: false,
          showAdvanced: false
        } as FilterState;
      case 'wannawax':
        return {
          showWaxingSalons: true
        } as FilterState;
      case 'wannamanipedi':
        return {
          showNailSalons: true
        } as FilterState;
      case 'wannawalkthedog':
        return {
          showDogParks: true
        } as FilterState;
      default:
        return {
          showBathrooms: true,
          showDogParks: true,
          showShowers: true,
          showBabyChanging: false,
          showWheelchairAccessible: false,
          showBidet: false,
          showToiletPaper: false,
          showHandDryer: false,
          showSanitaryDisposal: false
        };
    }
  };

  const [filters, setFilters] = useState<FilterState>(getInitialFilters(appType));
  
  console.log('🔧 UnifiedMapPage current filters:', filters);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languageLabels, setLanguageLabels] = useState<any>(null);

  const handleLocationSelect = (location: SearchLocation) => {
    setSearchLocation({ lat: location.lat, lng: location.lng });
  };

  const handleUserLocationFound = (location: UserLocation) => {
    setUserLocation(location);
  };

  const handleMarkerClick = (markerData: MarkerData) => {
    setSelectedMarker(markerData);
  };

  const handleCloseInfoPanel = () => {
    setSelectedMarker(null);
  };

  const handleLanguageChange = (language: string, labels: any) => {
    setCurrentLanguage(language);
    if (labels) {
      setLanguageLabels(labels);
    }
  };

  const handleLanguageDetected = (detectedLanguage: string) => {
    console.log(`🌐 handleLanguageDetected called with: ${detectedLanguage} (current: ${currentLanguage})`);
    
    const languages = {
      'en': { bathrooms: 'Bathrooms', babyChange: 'Baby Change', accessible: 'Accessible', bidet: 'Bidet', toiletPaper: 'Toilet Paper', handDryer: 'Hand Dryer', sanitaryDisposal: 'Sanitary Disposal', showers: 'Showers', dogParks: 'Dog Parks', searchPlaceholder: 'Search any city or location worldwide...', searching: 'Searching...', noResults: 'No results found', findingLocation: 'Finding your location...', name: 'EN' },
      'es': { bathrooms: 'Baños', babyChange: 'Cambiador', accessible: 'Accesible', bidet: 'Bidé', toiletPaper: 'Papel Higiénico', handDryer: 'Secador', sanitaryDisposal: 'Contenedor', showers: 'Duchas', dogParks: 'Parques', searchPlaceholder: 'Buscar cualquier ciudad o ubicación...', searching: 'Buscando...', noResults: 'No se encontraron resultados', name: 'ES' },
      'ar': { bathrooms: 'دورات المياه', babyChange: 'تغيير الحفاضات', accessible: 'قابل للوصول', bidet: 'بيديه', toiletPaper: 'ورق تواليت', handDryer: 'مجفف يدين', sanitaryDisposal: 'صندوق قمامة', showers: 'دشات', dogParks: 'حدائق الكلاب', searchPlaceholder: 'ابحث عن أي مدينة أو موقع...', searching: 'جاري البحث...', noResults: 'لا توجد نتائج', findingLocation: 'جاري تحديد موقعك...', name: 'AR' },
      'zh': { bathrooms: '厕所', babyChange: '婴儿台', accessible: '无障碍', bidet: '坐浴盆', toiletPaper: '厕纸', handDryer: '烘手机', sanitaryDisposal: '垃圾桶', showers: '淋浴', dogParks: '狗公园', searchPlaceholder: '搜索任何城市或地点...', searching: '搜索中...', noResults: '未找到结果', name: '中文' },
      'ja': { bathrooms: 'トイレ', babyChange: 'おむつ台', accessible: 'バリアフリー', bidet: 'ビデ', toiletPaper: 'トイレットペーパー', handDryer: 'ハンドドライヤー', sanitaryDisposal: 'サニタリーボックス', showers: 'シャワー', dogParks: 'ドッグパーク', searchPlaceholder: '都市や場所を検索...', searching: '検索中...', noResults: '結果が見つかりません', name: '日本語' },
      'fr': { bathrooms: 'Toilettes', babyChange: 'Change', accessible: 'Accessible', bidet: 'Bidet', toiletPaper: 'Papier Toilette', handDryer: 'Sèche-mains', sanitaryDisposal: 'Poubelle Sanitaire', showers: 'Douches', dogParks: 'Parcs', searchPlaceholder: 'Rechercher une ville ou un lieu...', searching: 'Recherche...', noResults: 'Aucun résultat trouvé', name: 'FR' }
    };
    
    const newLabels = languages[detectedLanguage] || languages['en'];
    setCurrentLanguage(detectedLanguage);
    setLanguageLabels(newLabels);
    handleLanguageChange(detectedLanguage, newLabels);
    
    // Notify FilterControls about the detected language
    const event = new CustomEvent('languageDetected', { 
      detail: { language: detectedLanguage, labels: newLabels } 
    });
    window.dispatchEvent(event);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{getAppTitle(appType)} - Finding your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToSelector}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Apps
          </Button>
          <span className="font-semibold text-gray-900 text-lg">
            {getAppTitle(appType)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <span className="text-sm text-gray-600">
                {user?.firstName || 'User'}
              </span>
              {user?.role === 'admin' && (
                <Button asChild variant="outline" size="sm">
                  <a href="/admin">Admin</a>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <a href="/api/logout">Logout</a>
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <Button asChild variant="outline" size="sm">
              <a href="/api/login">Login</a>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Controls Panel */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
        {/* Search Bar with Language Toggle */}
        <div className="flex items-center gap-3">
          <SearchBar
            onLocationSelect={handleLocationSelect}
            onLanguageDetected={handleLanguageDetected}
            onLanguageChange={handleLanguageChange}
            language={currentLanguage}
          />
          <FilterControls
            filters={filters}
            onFilterChange={setFilters}
            onLocationFound={handleUserLocationFound}
            onLanguageChange={handleLanguageChange}
            appType={appType}
            showOnlyLanguageToggle={true}
          />
        </div>
        
        {/* Filter Controls */}
        <div className="overflow-x-auto">
          <div className="flex items-center space-x-2 pb-2">
            <FilterControls
              filters={filters}
              onFilterChange={(newFilters) => {
                console.log('🔧 UnifiedMapPage onFilterChange called with:', newFilters);
                setFilters(newFilters);
              }}
              onLocationFound={handleUserLocationFound}
              onLanguageChange={handleLanguageChange}
              appType={appType}
              showOnlyFilters={true}
            />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          filters={filters}
          userLocation={userLocation}
          searchLocation={searchLocation}
          onMarkerClick={handleMarkerClick}
          language={currentLanguage}
          appType={appType}
        />
        
        {selectedMarker && (
          <InfoPanel
            markerData={selectedMarker}
            onClose={handleCloseInfoPanel}
            userLocation={userLocation}
            language={currentLanguage}
          />
        )}
      </div>
    </div>
  );
}