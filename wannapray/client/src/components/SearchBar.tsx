import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { searchLocations } from "@/lib/api";

interface SearchBarProps {
  onLocationSelect: (location: { name: string; lat: number; lng: number }) => void;
  onLanguageDetected: (language: string) => void;
  language?: string;
}

export default function SearchBar({ onLocationSelect, onLanguageDetected, language = 'en' }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState("Search any city or location worldwide...");
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const languages = {
      'en': "Search any city or location worldwide...",
      'ar': "ابحث عن أي مدينة أو موقع في العالم...",
      'zh': "搜索世界上任何城市或地点...",
      'ja': "世界中の都市や場所を検索...",
      'fr': "Rechercher n'importe quelle ville ou lieu...",
      'de': "Suche nach jeder Stadt oder Ort weltweit...",
      'es': "Buscar cualquier ciudad o ubicación...",
      'hi': "दुनिया भर के किसी भी शहर या स्थान की खोज करें...",
      'id': "Cari kota atau lokasi di seluruh dunia...",
      'ms': "Cari mana-mana bandar atau lokasi...",
      'ko': "전 세계 도시나 장소 검색...",
      'mn': "Дэлхийн хаана ч хот, газар хайх...",
      'ru': "Найти любой город или место в мире..."
    };
    
    setPlaceholder(languages[language] || languages['en']);
  }, [language]);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocations(searchQuery, language);
      setSuggestions(results.slice(0, 5));
      setShowSuggestions(true);
      
      // Language detection based on search results
      if (results.length > 0 && results[0].display_name) {
        const displayName = results[0].display_name;
        const detectedLang = detectLanguage(displayName);
        if (detectedLang && detectedLang !== language) {
          onLanguageDetected(detectedLang);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectLanguage = (text: string): string | null => {
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    // Japanese characters (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text)) return 'ja';
    // Korean characters
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    // Arabic characters
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    // Cyrillic (Russian, etc.)
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    
    return null;
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const location = {
      name: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    
    onLocationSelect(location);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-[1001] px-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white shadow-lg border-0 focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border max-h-60 overflow-y-auto z-[1002]">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-start gap-2"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name || suggestion.display_name?.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Searching...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}