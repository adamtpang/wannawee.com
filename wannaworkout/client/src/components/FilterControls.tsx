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
    workoutEquipment: 'Workout Equipment',
    outdoorGym: 'Outdoor Gym',
    fitnessStations: 'Fitness Stations',
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
      'en': { workoutEquipment: 'Workout Equipment', outdoorGym: 'Outdoor Gym', fitnessStations: 'Fitness Stations', accessible: 'Accessible', locateMe: 'Locate Me', name: 'EN' },
      'ar': { workoutEquipment: 'معدات التمرين', outdoorGym: 'صالة رياضية خارجية', fitnessStations: 'محطات اللياقة', accessible: 'قابل للوصول', locateMe: 'حدد موقعي', name: 'AR' },
      'zh': { workoutEquipment: '健身器材', outdoorGym: '户外健身房', fitnessStations: '健身站', accessible: '无障碍', locateMe: '定位我', name: '中文' },
      'ja': { workoutEquipment: 'ワークアウト器具', outdoorGym: '屋外ジム', fitnessStations: 'フィットネスステーション', accessible: 'バリアフリー', locateMe: '現在地', name: '日本語' },
      'fr': { workoutEquipment: 'Équipement fitness', outdoorGym: 'Gym extérieur', fitnessStations: 'Stations fitness', accessible: 'Accessible', locateMe: 'Me localiser', name: 'FR' },
      'de': { workoutEquipment: 'Trainingsgeräte', outdoorGym: 'Outdoor-Gym', fitnessStations: 'Fitness-Stationen', accessible: 'Barrierefrei', locateMe: 'Standort finden', name: 'DE' },
      'es': { workoutEquipment: 'Equipo de ejercicio', outdoorGym: 'Gimnasio al aire libre', fitnessStations: 'Estaciones de fitness', accessible: 'Accesible', locateMe: 'Ubicarme', name: 'ES' },
      'hi': { workoutEquipment: 'व्यायाम उपकरण', outdoorGym: 'आउटडोर जिम', fitnessStations: 'फिटनेस स्टेशन', accessible: 'सुगम्य', locateMe: 'मुझे खोजें', name: 'HI' },
      'id': { workoutEquipment: 'Peralatan Olahraga', outdoorGym: 'Gym Luar Ruangan', fitnessStations: 'Stasiun Fitness', accessible: 'Mudah Diakses', locateMe: 'Temukan Saya', name: 'ID' },
      'ms': { workoutEquipment: 'Peralatan Senaman', outdoorGym: 'Gim Luar', fitnessStations: 'Stesen Kecergasan', accessible: 'Mudah Diakses', locateMe: 'Cari Saya', name: 'MS' },
      'ko': { workoutEquipment: '운동 기구', outdoorGym: '야외 체육관', fitnessStations: '피트니스 스테이션', accessible: '접근 가능', locateMe: '내 위치', name: '한국어' },
      'mn': { workoutEquipment: 'Дасгалын багаж', outdoorGym: 'Гадаа биеийн тамир', fitnessStations: 'Фитнесс станц', accessible: 'Хүртээмжтэй', locateMe: 'Намайг олох', name: 'MN' },
      'ru': { workoutEquipment: 'Спортивное оборудование', outdoorGym: 'Уличный тренажерный зал', fitnessStations: 'Фитнес-станции', accessible: 'Доступный', locateMe: 'Найти меня', name: 'RU' }
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
          variant={getButtonVariant(filters.showWorkoutEquipment)}
          onClick={() => toggleFilter('showWorkoutEquipment')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showWorkoutEquipment', '🏋️', labels.workoutEquipment)}
        </Button>

        <Button
          size="sm"
          variant={getButtonVariant(filters.showOutdoorGym)}
          onClick={() => toggleFilter('showOutdoorGym')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showOutdoorGym', '🌳', labels.outdoorGym)}
        </Button>

        <Button
          size="sm"
          variant={getButtonVariant(filters.showFitnessStations)}
          onClick={() => toggleFilter('showFitnessStations')}
          className="justify-start h-12 md:h-10"
        >
          {getButtonContent('showFitnessStations', '💪', labels.fitnessStations)}
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