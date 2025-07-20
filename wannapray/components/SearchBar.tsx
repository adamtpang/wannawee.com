import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SearchLocation } from "@/types/map";

// Translation mapping for common location terms
const locationTranslations: Record<string, Record<string, string>> = {
  'en': {
    'France': 'France',
    'Japan': 'Japan', 
    'United States': 'United States',
    'Germany': 'Germany',
    'Spain': 'Spain',
    'Italy': 'Italy',
    'China': 'China',
    'Korea': 'Korea',
    'Russia': 'Russia',
    'Tokyo': 'Tokyo',
    'Paris': 'Paris',
    'London': 'London',
    'Berlin': 'Berlin',
    'Madrid': 'Madrid',
    'Rome': 'Rome',
    'Beijing': 'Beijing',
    'Seoul': 'Seoul',
    'Moscow': 'Moscow'
  },
  'es': {
    'France': 'Francia',
    'Japan': 'Japón',
    'United States': 'Estados Unidos', 
    'Germany': 'Alemania',
    'Spain': 'España',
    'Italy': 'Italia',
    'China': 'China',
    'Korea': 'Corea',
    'Russia': 'Rusia',
    'Tokyo': 'Tokio',
    'Paris': 'París',
    'London': 'Londres',
    'Berlin': 'Berlín',
    'Madrid': 'Madrid',
    'Rome': 'Roma',
    'Beijing': 'Pekín',
    'Seoul': 'Seúl',
    'Moscow': 'Moscú'
  },
  'ja': {
    'France': 'フランス',
    'Japan': '日本',
    'United States': 'アメリカ合衆国',
    'Germany': 'ドイツ',
    'Spain': 'スペイン', 
    'Italy': 'イタリア',
    'China': '中国',
    'Korea': '韓国',
    'Russia': 'ロシア',
    'Tokyo': '東京',
    'Paris': 'パリ',
    'London': 'ロンドン',
    'Berlin': 'ベルリン',
    'Madrid': 'マドリード',
    'Rome': 'ローマ',
    'Beijing': '北京',
    'Seoul': 'ソウル',
    'Moscow': 'モスクワ'
  },
  'zh': {
    'France': '法国',
    'Japan': '日本',
    'United States': '美国',
    'Germany': '德国', 
    'Spain': '西班牙',
    'Italy': '意大利',
    'China': '中国',
    'Korea': '韩国',
    'Russia': '俄罗斯',
    'Tokyo': '东京',
    'Paris': '巴黎',
    'London': '伦敦',
    'Berlin': '柏林',
    'Madrid': '马德里',
    'Rome': '罗马',
    'Beijing': '北京',
    'Seoul': '首尔',
    'Moscow': '莫斯科'
  },
  'ko': {
    'France': '프랑스',
    'Japan': '일본',
    'United States': '미국',
    'Germany': '독일',
    'Spain': '스페인',
    'Italy': '이탈리아', 
    'China': '중국',
    'Korea': '한국',
    'Russia': '러시아',
    'Tokyo': '도쿄',
    'Paris': '파리',
    'London': '런던',
    'Berlin': '베를린',
    'Madrid': '마드리드',
    'Rome': '로마',
    'Beijing': '베이징',
    'Seoul': '서울',
    'Moscow': '모스크바'
  },
  'ru': {
    'France': 'Франция',
    'Japan': 'Япония',
    'United States': 'США',
    'Germany': 'Германия',
    'Spain': 'Испания',
    'Italy': 'Италия',
    'China': 'Китай',
    'Korea': 'Корея',
    'Russia': 'Россия',
    'Tokyo': 'Токио',
    'Paris': 'Париж',
    'London': 'Лондон',
    'Berlin': 'Берлин',
    'Madrid': 'Мадрид',
    'Rome': 'Рим',
    'Beijing': 'Пекин',
    'Seoul': 'Сеул',
    'Moscow': 'Москва'
  },
  'ar': {
    'France': 'فرنسا',
    'Japan': 'اليابان',
    'United States': 'الولايات المتحدة',
    'Germany': 'ألمانيا',
    'Spain': 'إسبانيا',
    'Italy': 'إيطاليا',
    'China': 'الصين',
    'Korea': 'كوريا',
    'Russia': 'روسيا',
    'Tokyo': 'طوكيو',
    'Paris': 'باريس',
    'London': 'لندن',
    'Berlin': 'برلين',
    'Madrid': 'مدريد',
    'Rome': 'روما',
    'Beijing': 'بكين',
    'Seoul': 'سيول',
    'Moscow': 'موسكو'
  },
  'fr': {
    'France': 'France',
    'Japan': 'Japon',
    'United States': 'États-Unis',
    'Germany': 'Allemagne',
    'Spain': 'Espagne',
    'Italy': 'Italie',
    'China': 'Chine',
    'Korea': 'Corée',
    'Russia': 'Russie',
    'Tokyo': 'Tokyo',
    'Paris': 'Paris',
    'London': 'Londres',
    'Berlin': 'Berlin',
    'Madrid': 'Madrid',
    'Rome': 'Rome',
    'Beijing': 'Pékin',
    'Seoul': 'Séoul',
    'Moscow': 'Moscou'
  },
  'de': {
    'France': 'Frankreich',
    'Japan': 'Japan',
    'United States': 'Vereinigte Staaten',
    'Germany': 'Deutschland',
    'Spain': 'Spanien',
    'Italy': 'Italien',
    'China': 'China',
    'Korea': 'Korea',
    'Russia': 'Russland',
    'Tokyo': 'Tokio',
    'Paris': 'Paris',
    'London': 'London',
    'Berlin': 'Berlin',
    'Madrid': 'Madrid',
    'Rome': 'Rom',
    'Beijing': 'Peking',
    'Seoul': 'Seoul',
    'Moscow': 'Moskau'
  }
};

// Country/Region to language mapping
const countryLanguageMap: Record<string, string> = {
  // Arab countries
  'united arab emirates': 'ar',
  'uae': 'ar',
  'emirates': 'ar',
  'dubai': 'ar',
  'abu dhabi': 'ar',
  'saudi arabia': 'ar',
  'egypt': 'ar',
  'qatar': 'ar',
  'kuwait': 'ar',
  'bahrain': 'ar',
  'oman': 'ar',
  'jordan': 'ar',
  'lebanon': 'ar',
  'syria': 'ar',
  'iraq': 'ar',
  'morocco': 'ar',
  'algeria': 'ar',
  'tunisia': 'ar',
  'libya': 'ar',
  
  // Chinese regions
  'china': 'zh',
  'beijing': 'zh',
  'shanghai': 'zh',
  'guangzhou': 'zh',
  'shenzhen': 'zh',
  'hong kong': 'zh',
  'macau': 'zh',
  'taiwan': 'zh',
  
  // Japanese locations
  'japan': 'ja',
  'tokyo': 'ja',
  'osaka': 'ja',
  'kyoto': 'ja',
  'yokohama': 'ja',
  'nagoya': 'ja',
  
  // Korean locations
  'south korea': 'ko',
  'korea': 'ko',
  'seoul': 'ko',
  'busan': 'ko',
  'incheon': 'ko',
  'daegu': 'ko',
  
  // Russian regions
  'russia': 'ru',
  'moscow': 'ru',
  'saint petersburg': 'ru',
  'novosibirsk': 'ru',
  'yekaterinburg': 'ru',
  
  // German regions
  'germany': 'de',
  'berlin': 'de',
  'munich': 'de',
  'hamburg': 'de',
  'frankfurt': 'de',
  'cologne': 'de',
  'austria': 'de',
  'vienna': 'de',
  'switzerland': 'de', // Default for Switzerland
  
  // French regions
  'france': 'fr',
  'paris': 'fr',
  'lyon': 'fr',
  'marseille': 'fr',
  'toulouse': 'fr',
  'nice': 'fr',
  'belgium': 'fr', // Default for Belgium
  'brussels': 'fr',
  
  // Spanish regions
  'spain': 'es',
  'madrid': 'es',
  'barcelona': 'es',
  'valencia': 'es',
  'seville': 'es',
  'mexico': 'es',
  'argentina': 'es',
  'colombia': 'es',
  'peru': 'es',
  'chile': 'es',
  
  // Indonesian/Malay regions
  'indonesia': 'id',
  'jakarta': 'id',
  'surabaya': 'id',
  'bandung': 'id',
  'malaysia': 'ms',
  'kuala lumpur': 'ms',
  'singapore': 'en', // Default to English for Singapore
  
  // Hindi regions
  'india': 'hi',
  'delhi': 'hi',
  'mumbai': 'hi',
  'bangalore': 'hi',
  'hyderabad': 'hi',
  'chennai': 'hi',
  'kolkata': 'hi',
  
  // Mongolian regions
  'mongolia': 'mn',
  'ulaanbaatar': 'mn'
};

// Function to detect local language from location name
function detectLocationLanguage(locationName: string): string {
  console.log(`🔍 detectLocationLanguage called with: "${locationName}"`);
  const normalizedLocation = locationName.toLowerCase();
  console.log(`🔍 Normalized to: "${normalizedLocation}"`);
  
  // Check direct matches first
  for (const [location, language] of Object.entries(countryLanguageMap)) {
    if (normalizedLocation.includes(location)) {
      console.log(`✅ Match found: "${location}" -> ${language}`);
      return language;
    }
  }
  
  console.log(`❌ No match found, defaulting to English`);
  return 'en'; // Default to English
}

// Function to detect language from search query
function detectSearchLanguage(query: string): string {
  const trimmedQuery = query.trim();
  
  // Arabic detection (including Arabic numerals and punctuation)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(query)) {
    return 'ar';
  }
  
  // Chinese detection (CJK Unified Ideographs)
  if (/[\u4e00-\u9fff]/.test(query)) {
    return 'zh';
  }
  
  // Japanese detection (Hiragana, Katakana, Kanji)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(query)) {
    return 'ja';
  }
  
  // Korean detection (Hangul)
  if (/[\uac00-\ud7af\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(query)) {
    return 'ko';
  }
  
  // Russian/Cyrillic detection
  if (/[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/.test(query)) {
    return 'ru';
  }
  
  // Common city names in specific languages
  const cityLanguageMap: Record<string, string> = {
    'paris': 'fr',
    'londres': 'fr',
    'berlin': 'de',
    'münchen': 'de',
    'madrid': 'es',
    'barcelona': 'es',
    'milano': 'it',
    'roma': 'it',
    'москва': 'ru',
    'токио': 'ru',
    'parís': 'es',
    'berlín': 'es',
    'moscú': 'es'
  };
  
  const lowerQuery = trimmedQuery.toLowerCase();
  for (const [city, lang] of Object.entries(cityLanguageMap)) {
    if (lowerQuery.includes(city)) {
      return lang;
    }
  }
  
  // Default to English for Latin script
  return 'en';
}

// Function to translate location names
function translateLocationName(name: string, targetLang: string): string {
  if (!locationTranslations[targetLang]) return name;
  
  let translatedName = name;
  const translations = locationTranslations[targetLang];
  
  // Replace country names with translations
  Object.entries(translations).forEach(([english, translated]) => {
    translatedName = translatedName.replace(new RegExp(english, 'g'), translated);
  });
  
  return translatedName;
}

interface SearchBarProps {
  onLocationSelect: (location: SearchLocation) => void;
  language?: string;
  labels?: any;
  onLanguageDetected?: (detectedLanguage: string) => void;
  onLanguageToggle?: (useDetectedLanguage: boolean) => void;
}

export default function SearchBar({ onLocationSelect, language = 'en', labels, onLanguageDetected, onLanguageToggle }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [useDetectedLanguage, setUseDetectedLanguage] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Use interface language by default, only use detected language when user explicitly toggles
  const searchLanguage = (useDetectedLanguage && detectedLanguage) ? detectedLanguage : language;

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['/api/search/locations', query, searchLanguage],
    queryFn: async () => {
      const langParam = searchLanguage !== 'en' ? `&lang=${searchLanguage}` : '';
      const response = await fetch(`/api/search/locations?q=${encodeURIComponent(query)}${langParam}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      
      // Translate location names based on search language
      return data.map((result: any) => ({
        ...result,
        name: translateLocationName(result.name, searchLanguage || 'en')
      }));
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowResults(true);
    
    // Detect language when user types 2+ characters
    if (newQuery.length >= 2) {
      const detectedLang = detectSearchLanguage(newQuery);
      setDetectedLanguage(detectedLang);
      
      // Don't auto-switch interface language - keep search results in interface language by default
    } else {
      setDetectedLanguage(null);
    }
  };

  const handleLocationClick = (location: SearchLocation) => {
    console.log(`🔍 SearchBar handleLocationClick called with:`, location);
    console.log(`🔍 Current props - language: ${language}, onLanguageDetected: ${onLanguageDetected ? 'YES' : 'NO'}`);
    
    setQuery(location.name);
    setShowResults(false);
    
    // Detect local language based on the selected location
    const localLanguage = detectLocationLanguage(location.name);
    console.log(`🌍 Location selected: ${location.name}`);
    console.log(`🗣️ Detected language: ${localLanguage} (current: ${language})`);
    
    // Auto-switch interface to local language if different from current
    if (localLanguage !== language) {
      console.log(`🔄 Languages differ, checking callback...`);
      if (onLanguageDetected) {
        console.log(`🔄 Triggering language switch to: ${localLanguage}`);
        onLanguageDetected(localLanguage);
        
        // Also update page title to reflect language change
        document.title = localLanguage === 'ar' ? 'ونا وي - خرائط الحمامات' : 'Wanna Wee';
      } else {
        console.error(`❌ onLanguageDetected callback is missing!`);
      }
    } else {
      console.log(`🔄 No language switch needed: ${localLanguage} === ${language}`);
    }
    
    onLocationSelect(location);
  };

  const toggleLanguageMode = () => {
    const newUseDetected = !useDetectedLanguage;
    setUseDetectedLanguage(newUseDetected);
    if (onLanguageToggle) {
      onLanguageToggle(newUseDetected);
    }
  };

  return (
    <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          placeholder={labels?.searchPlaceholder || "Search any city or location worldwide..."}
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        
        {/* Language detection indicator and toggle */}
        {detectedLanguage && detectedLanguage !== 'en' && (
          <button
            onClick={toggleLanguageMode}
            className={`absolute right-2 top-1.5 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
              useDetectedLanguage 
                ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            title={useDetectedLanguage 
              ? `Search results in detected language (${detectedLanguage.toUpperCase()}). Click to use interface language.`
              : `Search results in interface language. Click to search in detected language (${detectedLanguage.toUpperCase()}).`
            }
          >
            {useDetectedLanguage ? `${detectedLanguage.toUpperCase()} ✓` : detectedLanguage.toUpperCase()}
          </button>
        )}
      </div>

      {showResults && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[9999] max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">{labels?.searching || "Searching..."}</div>
          ) : results.length > 0 ? (
            results.map((result: SearchLocation, index: number) => (
              <div
                key={`${result.lat}-${result.lng}-${index}`}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleLocationClick(result)}
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{result.name}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">{labels?.noResults || "No results found"}</div>
          )}
        </div>
      )}
    </div>
  );
}
