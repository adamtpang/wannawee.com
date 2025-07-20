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
}

export default function FilterControls({ 
  filters, 
  onFilterChange, 
  onLocationFound,
  onLanguageChange,
  onAutoLanguageDetected
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
    'en': { bathrooms: 'Bathrooms', babyChange: 'Baby Change', accessible: 'Accessible', showers: 'Showers', dogParks: 'Dog Parks', searchPlaceholder: 'Search any city or location worldwide...', searching: 'Searching...', noResults: 'No results found', findingLocation: 'Finding your location...', name: 'EN' },
    'es': { bathrooms: 'Baños', babyChange: 'Cambiador', accessible: 'Accesible', showers: 'Duchas', dogParks: 'Parques', searchPlaceholder: 'Buscar cualquier ciudad o ubicación...', searching: 'Buscando...', noResults: 'No se encontraron resultados', name: 'ES' },
    'fr': { bathrooms: 'Toilettes', babyChange: 'Change', accessible: 'Accessible', showers: 'Douches', dogParks: 'Parcs', searchPlaceholder: 'Rechercher une ville ou un lieu...', searching: 'Recherche...', noResults: 'Aucun résultat trouvé', name: 'FR' },
    'ru': { bathrooms: 'Туалеты', babyChange: 'Пеленание', accessible: 'Доступно', showers: 'Душевые', dogParks: 'Собачьи парки', searchPlaceholder: 'Найти город или место...', searching: 'Поиск...', noResults: 'Ничего не найдено', name: 'RU' },
    'id': { bathrooms: 'Toilet', babyChange: 'Ganti Popok', accessible: 'Dapat Diakses', showers: 'Pancuran', dogParks: 'Taman Anjing', searchPlaceholder: 'Cari kota atau lokasi mana pun...', searching: 'Mencari...', noResults: 'Tidak ada hasil', name: 'ID' },
    'ms': { bathrooms: 'Tandas', babyChange: 'Tukar Lampin', accessible: 'Boleh Diakses', showers: 'Pancuran', dogParks: 'Taman Anjing', searchPlaceholder: 'Cari mana-mana bandar atau lokasi...', searching: 'Mencari...', noResults: 'Tiada keputusan', name: 'MS' },
    'ar': { bathrooms: 'دورات المياه', babyChange: 'تغيير الحفاضات', accessible: 'قابل للوصول', showers: 'دشات', dogParks: 'حدائق الكلاب', searchPlaceholder: 'ابحث عن أي مدينة أو موقع...', searching: 'جاري البحث...', noResults: 'لا توجد نتائج', findingLocation: 'جاري تحديد موقعك...', name: 'AR' },
    'zh': { bathrooms: '厕所', babyChange: '婴儿台', accessible: '无障碍', showers: '淋浴', dogParks: '狗公园', searchPlaceholder: '搜索任何城市或地点...', searching: '搜索中...', noResults: '未找到结果', name: '中文' },
    'ja': { bathrooms: 'トイレ', babyChange: 'おむつ台', accessible: 'バリアフリー', showers: 'シャワー', dogParks: 'ドッグパーク', searchPlaceholder: '都市や場所を検索...', searching: '検索中...', noResults: '結果が見つかりません', name: '日本語' },
    'ko': { bathrooms: '화장실', babyChange: '기저귀실', accessible: '휠체어', showers: '샤워실', dogParks: '애견공원', searchPlaceholder: '도시나 장소 검색...', searching: '검색 중...', noResults: '결과 없음', name: '한국어' },
    'de': { bathrooms: 'Toilette', babyChange: 'Wickeln', accessible: 'Barrierefrei', showers: 'Duschen', dogParks: 'Hundeparks', searchPlaceholder: 'Stadt oder Ort suchen...', searching: 'Suche...', noResults: 'Keine Ergebnisse', name: 'DE' },
    'hi': { bathrooms: 'शौचालय', babyChange: 'डायपर', accessible: 'सुलभ', showers: 'स्नान', dogParks: 'कुत्ता पार्क', searchPlaceholder: 'कोई भी शहर या स्थान खोजें...', searching: 'खोज रहे हैं...', noResults: 'कोई परिणाम नहीं', name: 'हिन्दी' },
    'mn': { bathrooms: 'Бие засах', babyChange: 'Нялхасны', accessible: 'Хүртээмжтэй', showers: 'Шүршүүр', dogParks: 'Нохойн цэцэрлэг', searchPlaceholder: 'Хот эсвэл газар хайх...', searching: 'Хайж байна...', noResults: 'Үр дүн олдсонгүй', name: 'МН' }
  };
  
  const labels = languages[selectedLanguage] || languages['en'];
  
  // Cycle through languages - if we have a detected language, toggle between EN and detected language
  const getNextLanguage = () => {
    if (detectedLanguage && detectedLanguage !== 'en') {
      // Simple toggle between English and detected language only
      const nextLang = selectedLanguage === 'en' ? detectedLanguage : 'en';
      console.log(`🔄 Two-language toggle: ${selectedLanguage} -> ${nextLang} (detected: ${detectedLanguage})`);
      return nextLang;
    } else {
      // Default behavior: cycle through main languages (EN, ES, local)
      const browserLang = navigator.language?.split('-')[0] || 'en';
      const mainLanguages = ['en', 'es', browserLang].filter((lang, index, arr) => arr.indexOf(lang) === index);
      const currentIndex = mainLanguages.indexOf(selectedLanguage);
      const nextIndex = (currentIndex + 1) % mainLanguages.length;
      const nextLanguage = mainLanguages[nextIndex];
      console.log(`🔄 Multi-language cycle: ${selectedLanguage} -> ${nextLanguage}`);
      return nextLanguage;
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
  const handleAutoLanguageDetection = (detectedLanguage: string) => {
    if (detectedLanguage !== selectedLanguage) {
      changeLanguageTo(detectedLanguage);
    }
  };

  // Listen for global language changes
  useEffect(() => {
    const handleLanguageChangeEvent = (event: CustomEvent) => {
      const { language, labels } = event.detail;
      console.log(`🔧 FilterControls received languageChanged event: ${language}`);
      console.log(`🔧 Current selectedLanguage: ${selectedLanguage}, updating to: ${language}`);
      setSelectedLanguage(language);
      
      // Set detected language to enable two-language toggle
      if (language !== 'en') {
        console.log(`🔧 Setting detected language to: ${language}`);
        setDetectedLanguage(language);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChangeEvent as EventListener);
    };
  }, [selectedLanguage]);

  // Also sync directly with parent language prop changes
  useEffect(() => {
    // This ensures the toggle updates when parent language changes
    console.log(`🔧 FilterControls syncing with current language changes`);
  }, []);

  // Listen for automatic language changes from search detection
  useEffect(() => {
    const handleAutoLanguageChange = (event: CustomEvent) => {
      const { language } = event.detail;
      changeLanguageTo(language);
    };

    const element = controlsRef.current;
    if (element) {
      element.addEventListener('auto-language-change', handleAutoLanguageChange as EventListener);
      return () => {
        element.removeEventListener('auto-language-change', handleAutoLanguageChange as EventListener);
      };
    }
  }, [onLanguageChange]);

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

  const toggleWheelchairAccessible = () => {
    onFilterChange({
      ...filters,
      showWheelchairAccessible: !filters.showWheelchairAccessible
    });
  };

  const toggleShowers = () => {
    onFilterChange({
      ...filters,
      showShowers: !filters.showShowers
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

  return (
    <div 
      ref={controlsRef}
      data-language-controls
      className="flex items-center space-x-1 md:space-x-2"
    >
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
        <span className="font-medium hidden md:inline">Bidet</span>
        <span className="font-medium md:hidden">{showEmojis ? "🚿" : "Bidet"}</span>
      </Button>
      
      <Button
        variant={filters.showToiletPaper ? "default" : "outline"}
        size="default"
        onClick={toggleToiletPaper}
        className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        title="Bathrooms with toilet paper"
      >
        <div className="w-3 h-3 md:w-3 md:h-3 bg-yellow-600 rounded-full"></div>
        <span className="font-medium hidden md:inline">Toilet Paper</span>
        <span className="font-medium md:hidden">{showEmojis ? "🧻" : "Paper"}</span>
      </Button>
      
      <Button
        variant={filters.showHandDryer ? "default" : "outline"}
        size="default"
        onClick={toggleHandDryer}
        className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        title="Bathrooms with hand dryers"
      >
        <div className="w-3 h-3 md:w-3 md:h-3 bg-pink-600 rounded-full"></div>
        <span className="font-medium hidden md:inline">Hand Dryer</span>
        <span className="font-medium md:hidden">{showEmojis ? "🌬️" : "Dryer"}</span>
      </Button>
      
      <Button
        variant={filters.showSanitaryDisposal ? "default" : "outline"}
        size="default"
        onClick={toggleSanitaryDisposal}
        className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        title="Bathrooms with sanitary disposal bins"
      >
        <div className="w-3 h-3 md:w-3 md:h-3 bg-teal-600 rounded-full"></div>
        <span className="font-medium hidden md:inline">Sanitary Disposal</span>
        <span className="font-medium md:hidden">{showEmojis ? "🗑️" : "Disposal"}</span>
      </Button>
      
      <Button
        variant={filters.showShowers ? "default" : "outline"}
        size="default"
        onClick={toggleShowers}
        className="flex items-center space-x-2 md:space-x-2 text-sm md:text-base px-4 md:px-3 py-3 md:py-2 whitespace-nowrap min-h-[48px] md:min-h-[40px] border-2"
        title="Public shower facilities"
      >
        <div className="w-3 h-3 md:w-3 md:h-3 bg-cyan-600 rounded-full"></div>
        <span className="font-medium hidden md:inline">{labels.showers}</span>
        <span className="font-medium md:hidden">{showEmojis ? "🚿" : labels.showers}</span>
      </Button>
      
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
