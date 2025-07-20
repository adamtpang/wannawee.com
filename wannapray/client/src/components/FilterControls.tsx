import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FilterState } from "@/types/map";

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onLocateMe: () => void;
  language?: string;
}

export default function FilterControls({ filters, onFiltersChange, onLocateMe, language = 'en' }: FilterControlsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [useEmoji, setUseEmoji] = useState(false);
  const [labels, setLabels] = useState({
    prayerRooms: 'Prayer Rooms',
    multiFaith: 'Multi-Faith',
    islamic: 'Islamic',
    accessible: 'Accessible',
    locateMe: 'Locate Me',
    name: 'EN'
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    console.log('🔧 FilterControls syncing with current language changes');
    const languages = {
      'en': { prayerRooms: 'Prayer Rooms', multiFaith: 'Multi-Faith', islamic: 'Islamic', accessible: 'Accessible', locateMe: 'Locate Me', name: 'EN' },
      'ar': { prayerRooms: 'غرف الصلاة', multiFaith: 'متعدد الأديان', islamic: 'إسلامي', accessible: 'قابل للوصول', locateMe: 'حدد موقعي', name: 'AR' },
      'zh': { prayerRooms: '祈祷室', multiFaith: '多信仰', islamic: '伊斯兰', accessible: '无障碍', locateMe: '定位我', name: '中文' },
      'ja': { prayerRooms: '祈祷室', multiFaith: '多宗教', islamic: 'イスラム', accessible: 'バリアフリー', locateMe: '現在地', name: '日本語' },
      'fr': { prayerRooms: 'Salles de prière', multiFaith: 'Multi-confessionnel', islamic: 'Islamique', accessible: 'Accessible', locateMe: 'Me localiser', name: 'FR' },
      'de': { prayerRooms: 'Gebetsräume', multiFaith: 'Multireligiös', islamic: 'Islamisch', accessible: 'Barrierefrei', locateMe: 'Standort finden', name: 'DE' },
      'es': { prayerRooms: 'Salas de oración', multiFaith: 'Multi-fe', islamic: 'Islámico', accessible: 'Accesible', locateMe: 'Ubicarme', name: 'ES' },
      'hi': { prayerRooms: 'प्रार्थना कक्ष', multiFaith: 'बहु-धर्म', islamic: 'इस्लामिक', accessible: 'सुगम्य', locateMe: 'मुझे खोजें', name: 'HI' },
      'id': { prayerRooms: 'Ruang Doa', multiFaith: 'Multi-Agama', islamic: 'Islam', accessible: 'Mudah Diakses', locateMe: 'Temukan Saya', name: 'ID' },
      'ms': { prayerRooms: 'Bilik Solat', multiFaith: 'Pelbagai Agama', islamic: 'Islam', accessible: 'Mudah Diakses', locateMe: 'Cari Saya', name: 'MS' },
      'ko': { prayerRooms: '기도실', multiFaith: '다종교', islamic: '이슬람', accessible: '접근 가능', locateMe: '내 위치', name: '한국어' },
      'mn': { prayerRooms: 'Залбирлын өрөө', multiFaith: 'Олон шашин', islamic: 'Ислам', accessible: 'Хүртээмжтэй', locateMe: 'Намайг олох', name: 'MN' },
      'ru': { prayerRooms: 'Молитвенные комнаты', multiFaith: 'Многоконфессиональный', islamic: 'Исламский', accessible: 'Доступный', locateMe: 'Найти меня', name: 'RU' }
    };
    
    setLabels(languages[language] || languages['en']);
  }, [language]);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { language: newLanguage, labels: newLabels } = event.detail;
      if (newLabels) {
        console.log('🔧 FilterControls received language event:', newLanguage);
        setLabels(newLabels);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
  }, []);

  const toggleFilter = (key: keyof FilterState) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key]
    });
  };

  const getButtonVariant = (isActive: boolean) => {
    return isActive ? "default" : "outline";
  };

  const getButtonContent = (key: keyof FilterState, emoji: string, text: string) => {
    if (isMobile && useEmoji) {
      return emoji;
    }
    return text;
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 space-y-2 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Filters</h3>
        {isMobile && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setUseEmoji(!useEmoji)}
            className="text-xs px-2 py-1 h-6"
          >
            {useEmoji ? 'Text' : 'Emoji'}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        <Button
          size="sm"
          variant={getButtonVariant(filters.showPrayerRooms)}
          onClick={() => toggleFilter('showPrayerRooms')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showPrayerRooms', '🕌', labels.prayerRooms)}
        </Button>

        <Button
          size="sm"
          variant={getButtonVariant(filters.showMultiFaith)}
          onClick={() => toggleFilter('showMultiFaith')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showMultiFaith', '🤝', labels.multiFaith)}
        </Button>

        <Button
          size="sm"
          variant={getButtonVariant(filters.showIslamic)}
          onClick={() => toggleFilter('showIslamic')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showIslamic', '☪️', labels.islamic)}
        </Button>

        <Button
          size="sm"
          variant={getButtonVariant(filters.showAccessible)}
          onClick={() => toggleFilter('showAccessible')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showAccessible', '♿', labels.accessible)}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={onLocateMe}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showAccessible', '📍', labels.locateMe)}
        </Button>
      </div>
    </div>
  );
}