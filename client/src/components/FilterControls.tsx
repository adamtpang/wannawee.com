import { MapPin, Type, Hash, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterState, UserLocation } from "@/types/map";
import { getCurrentPosition, GeolocationError } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onLocationFound: (location: UserLocation) => void;
  onLanguageChange?: (language: string, labels: any) => void;
  onAutoLanguageDetected?: (language: string) => void;
  appType?: string;
  showOnlyLanguageToggle?: boolean;
  showOnlyFilters?: boolean;
}

export default function FilterControls({ 
  filters, 
  onFilterChange, 
  onLocationFound,
  onLanguageChange,
  onAutoLanguageDetected,
  appType,
  showOnlyLanguageToggle = false,
  showOnlyFilters = false
}: FilterControlsProps) {
  const { toast } = useToast();
  const [showEmojis, setShowEmojis] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Auto-detect browser language, but allow override
    const browserLang = navigator.language || 'en';
    const langCode = browserLang.split('-')[0];
    return ['zh', 'ja', 'ko', 'es', 'fr', 'ru', 'id', 'ms', 'ar', 'de', 'hi', 'mn'].includes(langCode) ? langCode : 'en';
  });
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  // Language definitions
  const languages = {
    'en': { bathrooms: 'Bathrooms', babyChange: 'Baby Change', accessible: 'Accessible', bidet: 'Bidet', toiletPaper: 'Toilet Paper', handDryer: 'Hand Dryer', sanitaryDisposal: 'Sanitary Disposal', showers: 'Showers', dogParks: 'Dog Parks', fitnessEquipment: 'Fitness Equipment', outdoorGyms: 'Outdoor Gyms', swimmingPools: 'Swimming Pools', gyms: 'Gyms', playgrounds: 'Playgrounds', waterPlay: 'Water Play', searchPlaceholder: 'Search any city or location worldwide...', searching: 'Searching...', noResults: 'No results found', findingLocation: 'Finding your location...', name: 'EN' },
    'es': { bathrooms: 'Baños', babyChange: 'Cambiador', accessible: 'Accesible', bidet: 'Bidé', toiletPaper: 'Papel Higiénico', handDryer: 'Secador', sanitaryDisposal: 'Contenedor', showers: 'Duchas', dogParks: 'Parques', fitnessEquipment: 'Equipamiento Fitness', outdoorGyms: 'Gimnasios al Aire Libre', swimmingPools: 'Piscinas Públicas', gyms: 'Gimnasios', searchPlaceholder: 'Buscar cualquier ciudad o ubicación...', searching: 'Buscando...', noResults: 'No se encontraron resultados', name: 'ES' },
    'fr': { bathrooms: 'Toilettes', babyChange: 'Change', accessible: 'Accessible', bidet: 'Bidet', toiletPaper: 'Papier Toilette', handDryer: 'Sèche-mains', sanitaryDisposal: 'Poubelle Sanitaire', showers: 'Douches', dogParks: 'Parcs', fitnessEquipment: 'Équipement Fitness', outdoorGyms: 'Gymnases Extérieurs', swimmingPools: 'Piscines Publiques', gyms: 'Gymnases', searchPlaceholder: 'Rechercher une ville ou un lieu...', searching: 'Recherche...', noResults: 'Aucun résultat trouvé', name: 'FR' },
    'ru': { bathrooms: 'Туалеты', babyChange: 'Пеленание', accessible: 'Доступно', bidet: 'Биде', toiletPaper: 'Туалетная бумага', handDryer: 'Сушилка', sanitaryDisposal: 'Мусорка', showers: 'Душевые', dogParks: 'Собачьи парки', fitnessEquipment: 'Фитнес оборудование', outdoorGyms: 'Уличные тренажёры', swimmingPools: 'Общественные бассейны', gyms: 'Спортзалы', searchPlaceholder: 'Найти город или место...', searching: 'Поиск...', noResults: 'Ничего не найдено', name: 'RU' },
    'id': { bathrooms: 'Toilet', babyChange: 'Ganti Popok', accessible: 'Dapat Diakses', bidet: 'Bidet', toiletPaper: 'Tisu Toilet', handDryer: 'Pengering', sanitaryDisposal: 'Tempat Sampah', showers: 'Pancuran', dogParks: 'Taman Anjing', fitnessEquipment: 'Peralatan Fitness', outdoorGyms: 'Gym Outdoor', swimmingPools: 'Kolam Renang Umum', gyms: 'Gym', searchPlaceholder: 'Cari kota atau lokasi mana pun...', searching: 'Mencari...', noResults: 'Tidak ada hasil', name: 'ID' },
    'ms': { bathrooms: 'Tandas', babyChange: 'Tukar Lampin', accessible: 'Boleh Diakses', bidet: 'Bidet', toiletPaper: 'Tisu Tandas', handDryer: 'Pengering', sanitaryDisposal: 'Tong Sampah', showers: 'Pancuran', dogParks: 'Taman Anjing', fitnessEquipment: 'Peralatan Fitness', outdoorGyms: 'Gim Luar', swimmingPools: 'Kolam Renang Awam', gyms: 'Gim', searchPlaceholder: 'Cari mana-mana bandar atau lokasi...', searching: 'Mencari...', noResults: 'Tiada keputusan', name: 'MS' },
    'ar': { bathrooms: 'دورات المياه', babyChange: 'تغيير الحفاضات', accessible: 'قابل للوصول', bidet: 'بيديه', toiletPaper: 'ورق تواليت', handDryer: 'مجفف يدين', sanitaryDisposal: 'صندوق قمامة', showers: 'دشات', dogParks: 'حدائق الكلاب', fitnessEquipment: 'معدات اللياقة', outdoorGyms: 'صالات خارجية', swimmingPools: 'مسابح عامة', gyms: 'صالات رياضية', searchPlaceholder: 'ابحث عن أي مدينة أو موقع...', searching: 'جاري البحث...', noResults: 'لا توجد نتائج', findingLocation: 'جاري تحديد موقعك...', name: 'AR' },
    'zh': { bathrooms: '厕所', babyChange: '婴儿台', accessible: '无障碍', bidet: '坐浴盆', toiletPaper: '厕纸', handDryer: '烘手机', sanitaryDisposal: '垃圾桶', showers: '淋浴', dogParks: '狗公园', fitnessEquipment: '健身器材', outdoorGyms: '户外健身房', swimmingPools: '游泳池', gyms: '健身房', playgrounds: '游乐场', waterPlay: '水上游戏', searchPlaceholder: '搜索任何城市或地点...', searching: '搜索中...', noResults: '未找到结果', name: '中文' },
    'ja': { bathrooms: 'トイレ', babyChange: 'おむつ台', accessible: 'バリアフリー', bidet: 'ビデ', toiletPaper: 'トイレットペーパー', handDryer: 'ハンドドライヤー', sanitaryDisposal: 'サニタリーボックス', showers: 'シャワー', dogParks: 'ドッグパーク', fitnessEquipment: 'フィットネス機器', outdoorGyms: '屋外ジム', swimmingPools: '公共プール', gyms: 'ジム', searchPlaceholder: '都市や場所を検索...', searching: '検索中...', noResults: '結果が見つかりません', name: '日本語' },
    'ko': { bathrooms: '화장실', babyChange: '기저귀실', accessible: '휠체어', bidet: '비데', toiletPaper: '화장지', handDryer: '핸드드라이어', sanitaryDisposal: '휴지통', showers: '샤워실', dogParks: '애견공원', fitnessEquipment: '운동기구', outdoorGyms: '야외체육관', swimmingPools: '공공수영장', gyms: '체육관', searchPlaceholder: '도시나 장소 검색...', searching: '검색 중...', noResults: '결과 없음', name: '한국어' },
    'de': { bathrooms: 'Toilette', babyChange: 'Wickeln', accessible: 'Barrierefrei', bidet: 'Bidet', toiletPaper: 'Toilettenpapier', handDryer: 'Händetrockner', sanitaryDisposal: 'Mülleimer', showers: 'Duschen', dogParks: 'Hundeparks', fitnessEquipment: 'Fitnessgeräte', outdoorGyms: 'Outdoor-Fitnessstudios', swimmingPools: 'Öffentliche Schwimmbäder', gyms: 'Fitnessstudios', searchPlaceholder: 'Stadt oder Ort suchen...', searching: 'Suche...', noResults: 'Keine Ergebnisse', name: 'DE' },
    'hi': { bathrooms: 'शौचालय', babyChange: 'डायपर', accessible: 'सुलभ', bidet: 'बिडेट', toiletPaper: 'टॉयलेट पेपर', handDryer: 'हैंड ड्रायर', sanitaryDisposal: 'कूड़ादान', showers: 'स्नान', dogParks: 'कुत्ता पार्क', fitnessEquipment: 'फिटनेस उपकरण', outdoorGyms: 'आउटडोर जिम', swimmingPools: 'सार्वजनिक स्विमिंग पूल', gyms: 'जिम', searchPlaceholder: 'कोई भी शहर या स्थान खोजें...', searching: 'खोज रहे हैं...', noResults: 'कोई परिणाम नहीं', name: 'हिन्दी' },
    'mn': { bathrooms: 'Бие засах', babyChange: 'Нялхасны', accessible: 'Хүртээмжтэй', bidet: 'Биде', toiletPaper: 'Цаас', handDryer: 'Хатаагч', sanitaryDisposal: 'Хогийн сав', showers: 'Шүршүүр', dogParks: 'Нохойн цэцэрлэг', fitnessEquipment: 'Дасгалын хэрэгсэл', outdoorGyms: 'Гадна биеийн тамир', swimmingPools: 'Нийтийн усан сан', gyms: 'Спорт заал', searchPlaceholder: 'Хот эсвэл газар хайх...', searching: 'Хайж байна...', noResults: 'Үр дүн олдсонгүй', name: 'МН' }
  };
  
  const labels = languages[selectedLanguage] || languages['en'];
  
  // Always toggle between English and detected language when we have one
  const getNextLanguage = () => {
    if (detectedLanguage && detectedLanguage !== 'en') {
      // Simple toggle between English and detected language only
      const nextLang = selectedLanguage === 'en' ? detectedLanguage : 'en';
      console.log(`🔄 Two-language toggle: ${selectedLanguage} -> ${nextLang} (detected: ${detectedLanguage})`);
      return nextLang;
    } else {
      // If no detected language, stay in English
      console.log(`🔄 No detected language, staying in English`);
      return 'en';
    }
  };
  
  const cycleLanguage = () => {
    const nextLanguage = getNextLanguage();
    console.log(`🔄 cycleLanguage: ${selectedLanguage} -> ${nextLanguage}`);
    changeLanguageTo(nextLanguage);
  };

  const changeLanguageTo = (newLanguage: string) => {
    console.log(`🔄 changeLanguageTo: ${selectedLanguage} -> ${newLanguage}`);
    setSelectedLanguage(newLanguage);
    
    // Notify parent component of language change
    if (onLanguageChange) {
      const nextLabels = languages[newLanguage] || languages['en'];
      console.log(`🔄 Calling onLanguageChange with: ${newLanguage}`, nextLabels);
      onLanguageChange(newLanguage, nextLabels);
    }
  };

  // Handle automatic language detection from location search
  const handleAutoLanguageDetection = (detectedLang: string) => {
    console.log(`🔍 handleAutoLanguageDetection: ${detectedLang}`);
    setDetectedLanguage(detectedLang);
    if (detectedLang !== selectedLanguage) {
      changeLanguageTo(detectedLang);
    }
  };

  // Listen for global language changes and force re-render
  useEffect(() => {
    const handleLanguageChangeEvent = (event: CustomEvent) => {
      const { language, labels } = event.detail;
      console.log(`🔧 FilterControls received languageChanged event: ${language}`);
      console.log(`🔧 Current selectedLanguage: ${selectedLanguage}, updating to: ${language}`);
      setSelectedLanguage(language);
      
      // Set detected language to enable two-language toggle
      if (language !== 'en' && language !== detectedLanguage) {
        console.log(`🔧 Setting detected language to: ${language}`);
        setDetectedLanguage(language);
      }
      
      // Force component re-render by updating a dummy state
      setShowEmojis(prev => prev);
    };

    window.addEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    };
  }, [selectedLanguage, detectedLanguage]);

  // Also sync directly with parent language prop changes
  useEffect(() => {
    // This ensures the toggle updates when parent language changes
    console.log(`🔧 FilterControls syncing with current language changes`);
  }, []);

  // Listen for automatic language changes from search detection
  useEffect(() => {
    const handleLanguageDetected = (event: CustomEvent) => {
      const { language, labels } = event.detail;
      console.log(`🔧 FilterControls received languageDetected event: ${language}`);
      setDetectedLanguage(language);
      setSelectedLanguage(language);
      
      // Force component re-render
      setShowEmojis(prev => prev);
    };

    window.addEventListener('languageDetected', handleLanguageDetected as EventListener);
    return () => {
      window.removeEventListener('languageDetected', handleLanguageDetected as EventListener);
    };
  }, []);

  const toggleBathrooms = () => {
    onFilterChange({
      ...filters,
      showBathrooms: !filters.showBathrooms
    });
  };

  const toggleDogParks = () => {
    onFilterChange({
      ...filters,
      showDogParks: !filters.showDogParks
    });
  };

  const toggleBabyChanging = () => {
    onFilterChange({
      ...filters,
      showBabyChanging: !filters.showBabyChanging
    });
  };

  const toggleBidet = () => {
    onFilterChange({
      ...filters,
      showBidet: !filters.showBidet
    });
  };

  const toggleToiletPaper = () => {
    onFilterChange({
      ...filters,
      showToiletPaper: !filters.showToiletPaper
    });
  };

  const toggleHandDryer = () => {
    onFilterChange({
      ...filters,
      showHandDryer: !filters.showHandDryer
    });
  };

  const toggleSanitaryDisposal = () => {
    onFilterChange({
      ...filters,
      showSanitaryDisposal: !filters.showSanitaryDisposal
    });
  };

  // Fitness-related toggle functions
  const toggleFitnessStations = () => {
    console.log('🔄 toggleFitnessStations clicked, current state:', filters.showFitnessStations);
    const newState = {
      ...filters,
      showFitnessStations: !filters.showFitnessStations
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleOutdoorGyms = () => {
    console.log('🔄 toggleOutdoorGyms clicked, current state:', filters.showOutdoorGyms);
    const newState = {
      ...filters,
      showOutdoorGyms: !filters.showOutdoorGyms
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleSwimmingPools = () => {
    console.log('🔄 toggleSwimmingPools clicked, current state:', filters.showSwimmingPools);
    const newState = {
      ...filters,
      showSwimmingPools: !filters.showSwimmingPools
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleGyms = () => {
    console.log('🔄 toggleGyms clicked, current state:', filters.showGyms);
    const newState = {
      ...filters,
      showGyms: !filters.showGyms
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleWheelchairAccessible = () => {
    onFilterChange({
      ...filters,
      showWheelchairAccessible: !filters.showWheelchairAccessible
    });
  };

  const toggleShowers = () => {
    console.log('🔄 toggleShowers clicked, current state:', filters.showShowers);
    const newState = {
      ...filters,
      showShowers: !filters.showShowers
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  // Playground-related toggle functions
  const togglePlaygrounds = () => {
    onFilterChange({
      ...filters,
      showPlaygrounds: !filters.showPlaygrounds
    });
  };

  const toggleAccessible = () => {
    onFilterChange({
      ...filters,
      showAccessible: !filters.showAccessible
    });
  };

  const toggleWaterPlay = () => {
    onFilterChange({
      ...filters,
      showWaterPlay: !filters.showWaterPlay
    });
  };

  // Beauty service toggle functions
  const toggleWaxingSalons = () => {
    onFilterChange({
      ...filters,
      showWaxingSalons: !filters.showWaxingSalons
    });
  };

  const toggleNailSalons = () => {
    onFilterChange({
      ...filters,
      showNailSalons: !filters.showNailSalons
    });
  };

  const toggleBabyChange = () => {
    onFilterChange({
      ...filters,
      showBabyChange: !filters.showBabyChange
    });
  };

  // Prayer room toggle functions for WannaPray
  const toggleMosques = () => {
    console.log('🔄 toggleMosques clicked, current state:', filters.showMosques);
    const newState = {
      ...filters,
      showMosques: !filters.showMosques
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleChurches = () => {
    console.log('🔄 toggleChurches clicked, current state:', filters.showChurches);
    const newState = {
      ...filters,
      showChurches: !filters.showChurches
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const toggleMultiFaith = () => {
    console.log('🔄 toggleMultiFaith clicked, current state:', filters.showMultiFaith);
    const newState = {
      ...filters,
      showMultiFaith: !filters.showMultiFaith
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  const togglePrayerRooms = () => {
    console.log('🔄 togglePrayerRooms clicked, current state:', filters.showPrayerRooms);
    const newState = {
      ...filters,
      showPrayerRooms: !filters.showPrayerRooms
    };
    console.log('🔄 New filter state:', newState);
    onFilterChange(newState);
  };

  // WannaRoll toggle functions
  const toggleSkatePark = () => {
    onFilterChange({
      ...filters,
      showSkatePark: !filters.showSkatePark
    });
  };

  const toggleBMX = () => {
    onFilterChange({
      ...filters,
      showBMX: !filters.showBMX
    });
  };

  const toggleBeginner = () => {
    onFilterChange({
      ...filters,
      showBeginner: !filters.showBeginner
    });
  };

  const toggleAdvanced = () => {
    onFilterChange({
      ...filters,
      showAdvanced: !filters.showAdvanced
    });
  };

  // Missing WannaPlay toggle function
  const toggleToddlerAreas = () => {
    onFilterChange({
      ...filters,
      showToddlerAreas: !filters.showToddlerAreas
    });
  };

  const handleLocateMe = async () => {
    try {
      const location = await getCurrentPosition();
      onLocationFound(location);
      toast({
        title: "Location found",
        description: "Centered map on your current location",
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      if (error instanceof GeolocationError) {
        toast({
          variant: "destructive",
          title: "Location Error",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get your location",
        });
      }
    }
  };

  // Show only language toggle
  if (showOnlyLanguageToggle) {
    return (
      <div 
        ref={controlsRef}
        data-language-controls
        className="flex items-center space-x-2"
      >
        {/* Mobile: Emoji/Text toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojis(!showEmojis)}
            title={showEmojis ? "Switch to text" : "Switch to emojis"}
            className="px-2"
          >
            {showEmojis ? <Type className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Language toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={cycleLanguage}
          title={detectedLanguage && detectedLanguage !== 'en' ? 
            `Toggle between ${labels.name} and EN` : 
            `Language: ${labels.name}`}
          className={`px-3 py-2 text-sm font-medium ${detectedLanguage && detectedLanguage !== 'en' ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Globe className="w-4 h-4 mr-2" />
          {labels.name}
          {detectedLanguage && detectedLanguage !== 'en' && (
            <span className="ml-1 text-blue-600">
              {selectedLanguage === 'en' 
                ? ` ⇄ ${languages[detectedLanguage]?.name || detectedLanguage.toUpperCase()}`
                : ' ⇄ EN'
              }
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={controlsRef}
      data-language-controls
      className="flex items-center space-x-1 md:space-x-2 min-w-max"
    >
      {!showOnlyFilters && (
        <>
          {/* Mobile: Emoji/Text toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojis(!showEmojis)}
              title={showEmojis ? "Switch to text" : "Switch to emojis"}
              className="px-1"
            >
              {showEmojis ? <Type className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
            </Button>
          </div>
          
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleLanguage}
            title={detectedLanguage && detectedLanguage !== 'en' ? 
              `Toggle between ${labels.name} and EN` : 
              `Language: ${labels.name} (click to cycle)`}
            className={`px-2 text-xs font-semibold ${detectedLanguage && detectedLanguage !== 'en' ? 'bg-blue-50 border border-blue-200' : ''}`}
          >
            <Globe className="w-3 h-3 mr-1" />
            {labels.name}
            {detectedLanguage && detectedLanguage !== 'en' && (
              <span className="ml-1 text-blue-600">⇄</span>
            )}
          </Button>
        </>
      )}
      


      {/* WannaWorkOut specific buttons */}
      {appType === 'wannaworkout' && (
        <>
          <Button
            variant={filters.showFitnessStations ? "default" : "outline"}
            size="default"
            onClick={toggleFitnessStations}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.fitnessEquipment}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🏋️" : (selectedLanguage === 'zh' ? '健身' : selectedLanguage === 'es' ? 'Equipos' : 'Fitness')}</span>
          </Button>
          
          <Button
            variant={filters.showOutdoorGyms ? "default" : "outline"}
            size="default"
            onClick={toggleOutdoorGyms}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-green-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.outdoorGyms}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🏃" : (selectedLanguage === 'zh' ? '户外' : selectedLanguage === 'es' ? 'Gimnasios' : 'Gyms')}</span>
          </Button>
          
          <Button
            variant={filters.showSwimmingPools ? "default" : "outline"}
            size="default"
            onClick={toggleSwimmingPools}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-cyan-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.swimmingPools}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🏊" : (selectedLanguage === 'zh' ? '游泳池' : selectedLanguage === 'es' ? 'Piscinas' : 'Pools')}</span>
          </Button>
          
          <Button
            variant={filters.showGyms ? "default" : "outline"}
            size="default"
            onClick={toggleGyms}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.gyms}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🏢" : (selectedLanguage === 'zh' ? '健身房' : selectedLanguage === 'es' ? 'Gimnasios' : 'Gyms')}</span>
          </Button>
        </>
      )}
      
      {/* WannaWee specific buttons */}
      {appType === 'wannawee' && (
        <Button
          variant={filters.showBathrooms ? "default" : "outline"}
          size="default"
          onClick={toggleBathrooms}
          className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        >
          <div className="w-3 h-3 md:w-3 md:h-3 bg-orange-600 rounded-full"></div>
          <span className="font-medium hidden md:inline">{labels.bathrooms}</span>
          <span className="font-medium md:hidden">{showEmojis ? "🚻" : labels.bathrooms}</span>
        </Button>
      )}
      
      {/* WannaWee bathroom amenity buttons */}
      {appType === 'wannawee' && (
        <>
          <Button
            variant={filters.showBabyChanging ? "default" : "outline"}
            size="default"
            onClick={toggleBabyChanging}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Bathrooms with baby changing tables"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.babyChange}</span>
            <span className="font-medium md:hidden">{showEmojis ? "👶" : labels.babyChange}</span>
          </Button>
          
          <Button
            variant={filters.showWheelchairAccessible ? "default" : "outline"}
            size="default"
            onClick={toggleWheelchairAccessible}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Wheelchair accessible bathrooms"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.accessible}</span>
            <span className="font-medium md:hidden">{showEmojis ? "♿" : labels.accessible}</span>
          </Button>
          
          <Button
            variant={filters.showBidet ? "default" : "outline"}
            size="default"
            onClick={toggleBidet}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Bathrooms with bidets"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-indigo-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.bidet || 'Bidet'}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🚿" : (labels.bidet || 'Bidet')}</span>
          </Button>
          
          <Button
            variant={filters.showToiletPaper ? "default" : "outline"}
            size="default"
            onClick={toggleToiletPaper}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Bathrooms with toilet paper"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-yellow-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.toiletPaper || 'Toilet Paper'}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🧻" : (labels.toiletPaper ? (selectedLanguage === 'es' ? 'Papel' : 'Paper') : 'Paper')}</span>
          </Button>
          
          <Button
            variant={filters.showHandDryer ? "default" : "outline"}
            size="default"
            onClick={toggleHandDryer}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Bathrooms with hand dryers"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-pink-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.handDryer || 'Hand Dryer'}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🌬️" : (labels.handDryer ? (selectedLanguage === 'es' ? 'Secador' : 'Dryer') : 'Dryer')}</span>
          </Button>
          
          <Button
            variant={filters.showSanitaryDisposal ? "default" : "outline"}
            size="default"
            onClick={toggleSanitaryDisposal}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
            title="Bathrooms with sanitary disposal bins"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-teal-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.sanitaryDisposal || 'Sanitary Disposal'}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🗑️" : (labels.sanitaryDisposal ? (selectedLanguage === 'es' ? 'Contenedor' : 'Disposal') : 'Disposal')}</span>
          </Button>
        </>
      )}
      
      {/* Only show showers button for WannaWorkOut, hide all others */}
      {appType === 'wannaworkout' && (
        <Button
          variant={filters.showShowers ? "default" : "outline"}
          size="default"
          onClick={toggleShowers}
          className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          title="Public shower facilities"
        >
          <div className="w-3 h-3 md:w-3 md:h-3 bg-cyan-600 rounded-full"></div>
          <span className="font-medium hidden md:inline">{labels.showers}</span>
          <span className="font-medium md:hidden">{showEmojis ? "🚿" : (selectedLanguage === 'zh' ? '淋浴' : selectedLanguage === 'es' ? 'Duchas' : 'Showers')}</span>
        </Button>
      )}
      
      {/* WannaPlay specific buttons */}
      {appType === 'wannaplay' && (
        <>
          <Button
            variant={filters.showPlaygrounds ? "default" : "outline"}
            size="default"
            onClick={togglePlaygrounds}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-pink-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.playgrounds}</span>
            <span className="font-medium md:hidden">{showEmojis ? "🏰" : (selectedLanguage === 'zh' ? '游乐场' : selectedLanguage === 'es' ? 'Parques' : 'Playground')}</span>
          </Button>
          
          <Button
            variant={filters.showToddlerAreas ? "default" : "outline"}
            size="default"
            onClick={toggleToddlerAreas}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-orange-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Toddler Areas</span>
            <span className="font-medium md:hidden">{showEmojis ? "👶" : (selectedLanguage === 'zh' ? '幼儿区' : selectedLanguage === 'es' ? 'Bebés' : 'Toddler')}</span>
          </Button>
          
          <Button
            variant={filters.showAccessible ? "default" : "outline"}
            size="default"
            onClick={toggleAccessible}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.accessible}</span>
            <span className="font-medium md:hidden">{showEmojis ? "♿" : (selectedLanguage === 'zh' ? '无障碍' : selectedLanguage === 'es' ? 'Accesible' : 'Accessible')}</span>
          </Button>
          
          <Button
            variant={filters.showWaterPlay ? "default" : "outline"}
            size="default"
            onClick={toggleWaterPlay}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-cyan-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.waterPlay}</span>
            <span className="font-medium md:hidden">{showEmojis ? "💦" : (selectedLanguage === 'zh' ? '水上游戏' : selectedLanguage === 'es' ? 'Agua' : 'Water Play')}</span>
          </Button>
          
          <Button
            variant={filters.showBabyChange ? "default" : "outline"}
            size="default"
            onClick={toggleBabyChange}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">{labels.babyChange}</span>
            <span className="font-medium md:hidden">{showEmojis ? "👶" : (selectedLanguage === 'zh' ? '换尿布台' : selectedLanguage === 'es' ? 'Cambiador' : 'Baby Change')}</span>
          </Button>
        </>
      )}
      
      {/* WannaPray specific buttons */}
      {appType === 'wannapray' && (
        <>
          <Button
            variant={filters.showMosques ? "default" : "outline"}
            size="default"
            onClick={toggleMosques}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-green-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Mosques</span>
            <span className="font-medium md:hidden">{showEmojis ? "🕌" : (selectedLanguage === 'zh' ? '清真寺' : selectedLanguage === 'ar' ? 'مساجد' : 'Mosques')}</span>
          </Button>
          
          <Button
            variant={filters.showChurches ? "default" : "outline"}
            size="default"
            onClick={toggleChurches}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-blue-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Churches</span>
            <span className="font-medium md:hidden">{showEmojis ? "⛪" : (selectedLanguage === 'zh' ? '教堂' : selectedLanguage === 'ar' ? 'كنائس' : 'Churches')}</span>
          </Button>
          
          <Button
            variant={filters.showMultiFaith ? "default" : "outline"}
            size="default"
            onClick={toggleMultiFaith}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Multi-Faith</span>
            <span className="font-medium md:hidden">{showEmojis ? "🕯️" : (selectedLanguage === 'zh' ? '多宗教' : selectedLanguage === 'ar' ? 'متعدد الأديان' : 'Multi-Faith')}</span>
          </Button>
          
          <Button
            variant={filters.showPrayerRooms ? "default" : "outline"}
            size="default"
            onClick={togglePrayerRooms}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-red-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Prayer Rooms</span>
            <span className="font-medium md:hidden">{showEmojis ? "🙏" : (selectedLanguage === 'zh' ? '祈祷室' : selectedLanguage === 'ar' ? 'غرف الصلاة' : 'Prayer Rooms')}</span>
          </Button>
        </>
      )}
      
      {/* WannaRoll specific buttons */}
      {appType === 'wannaroll' && (
        <>
          <Button
            variant={filters.showSkatePark ? "default" : "outline"}
            size="default"
            onClick={toggleSkatePark}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-orange-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Skate Parks</span>
            <span className="font-medium md:hidden">{showEmojis ? "🛹" : (selectedLanguage === 'zh' ? '滑板公园' : selectedLanguage === 'es' ? 'Skate' : 'Skate')}</span>
          </Button>
          
          <Button
            variant={filters.showBMX ? "default" : "outline"}
            size="default"
            onClick={toggleBMX}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-red-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">BMX Tracks</span>
            <span className="font-medium md:hidden">{showEmojis ? "🚲" : (selectedLanguage === 'zh' ? 'BMX' : selectedLanguage === 'es' ? 'BMX' : 'BMX')}</span>
          </Button>
          
          <Button
            variant={filters.showBeginner ? "default" : "outline"}
            size="default"
            onClick={toggleBeginner}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-green-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Beginner</span>
            <span className="font-medium md:hidden">{showEmojis ? "🟢" : (selectedLanguage === 'zh' ? '初学者' : selectedLanguage === 'es' ? 'Principiante' : 'Beginner')}</span>
          </Button>
          
          <Button
            variant={filters.showAdvanced ? "default" : "outline"}
            size="default"
            onClick={toggleAdvanced}
            className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
          >
            <div className="w-3 h-3 md:w-3 md:h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium hidden md:inline">Advanced</span>
            <span className="font-medium md:hidden">{showEmojis ? "🔴" : (selectedLanguage === 'zh' ? '高级' : selectedLanguage === 'es' ? 'Avanzado' : 'Advanced')}</span>
          </Button>
        </>
      )}
      
      {/* Only show dog parks for WannaWalktheDog specifically */}
      {appType === 'wannawalkthedog' && (
        <Button
          variant={filters.showDogParks ? "default" : "outline"}
          size="default"
          onClick={toggleDogParks}
          className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        >
          <div className="w-3 h-3 md:w-3 md:h-3 bg-green-600 rounded-full"></div>
          <span className="font-medium hidden md:inline">{labels.dogParks}</span>
          <span className="font-medium md:hidden">{showEmojis ? "🐕" : labels.dogParks}</span>
        </Button>
      )}
      
      {/* WannaWax specific buttons */}
      {appType === 'wannawax' && (
        <Button
          variant={filters.showWaxingSalons ? "default" : "outline"}
          size="default"
          onClick={toggleWaxingSalons}
          className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        >
          <div className="w-3 h-3 md:w-3 md:h-3 bg-pink-600 rounded-full"></div>
          <span className="font-medium hidden md:inline">Waxing Salons</span>
          <span className="font-medium md:hidden">{showEmojis ? "💅" : "Waxing"}</span>
        </Button>
      )}
      
      {/* WannaManiPedi specific buttons */}
      {appType === 'wannamanipedi' && (
        <Button
          variant={filters.showNailSalons ? "default" : "outline"}
          size="default"
          onClick={toggleNailSalons}
          className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        >
          <div className="w-3 h-3 md:w-3 md:h-3 bg-amber-600 rounded-full"></div>
          <span className="font-medium hidden md:inline">Nail Salons</span>
          <span className="font-medium md:hidden">{showEmojis ? "💅" : "Nails"}</span>
        </Button>
      )}
      
      <Button
        variant="outline"
        size="default"
        onClick={handleLocateMe}
        title="Find my location"
        className="px-4 md:px-3 py-3 md:py-2 min-h-[48px] md:min-h-[40px] border-2"
      >
        <MapPin className="w-4 h-4 md:w-4 md:h-4" />
      </Button>
    </div>
  );
}
