import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface SearchBarProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  onLanguageDetected: (language: string) => void;
  language: string;
}

export default function SearchBar({ onLocationSelect, onLanguageDetected, language }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get localized labels
  const getLabels = () => {
    const labels = {
      'en': { placeholder: 'Search any city or location worldwide...', searching: 'Searching...', noResults: 'No results found' },
      'es': { placeholder: 'Buscar cualquier ciudad o lugar...', searching: 'Buscando...', noResults: 'No se encontraron resultados' },
      'fr': { placeholder: 'Rechercher une ville ou un lieu...', searching: 'Recherche...', noResults: 'Aucun résultat trouvé' },
      'de': { placeholder: 'Suche nach Stadt oder Ort...', searching: 'Suche...', noResults: 'Keine Ergebnisse gefunden' },
      'zh': { placeholder: '搜索任何城市或地点...', searching: '搜索中...', noResults: '未找到结果' },
      'ja': { placeholder: '都市や場所を検索...', searching: '検索中...', noResults: '結果が見つかりません' },
      'ar': { placeholder: 'ابحث عن أي مدينة أو موقع...', searching: 'جاري البحث...', noResults: 'لا توجد نتائج' },
    };
    return labels[language] || labels['en'];
  };

  const labels = getLabels();

  // Detect language from search query
  const detectLanguage = (text: string) => {
    // Arabic script
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    // Japanese (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(text)) return 'ja';
    // Korean (Hangul)
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    // Cyrillic (Russian, etc.)
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    
    // For Latin scripts, we could do more sophisticated detection
    // but for now, default to English
    return 'en';
  };

  // Search locations using Nominatim
  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const detectedLang = detectLanguage(searchQuery);
      if (detectedLang !== language) {
        onLanguageDetected(detectedLang);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1&accept-language=${language},en`
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchLocations(query);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, language]);

  const handleResultClick = (result: SearchResult) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name
    });
    setQuery(result.display_name.split(',')[0]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-4 left-4 right-20 z-[999] md:right-auto md:w-96" ref={searchRef}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={labels.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-[1000]">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-600 text-center">
                {labels.searching}
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.display_name.split(',')[0]}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {result.display_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : query.trim() && !isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-600 text-center">
                {labels.noResults}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}