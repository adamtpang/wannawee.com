import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Baby, Wheelchair, Waves } from "lucide-react";
import { FilterState } from "@/types/map";
import { getCurrentPosition } from "@/lib/geolocation";

interface FilterControlsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onLocateMe: () => void;
  language: string;
}

export default function FilterControls({ filters, onFiltersChange, onLocateMe, language }: FilterControlsProps) {
  const [isMobileTextMode, setIsMobileTextMode] = useState(false);

  // Get localized labels
  const getLabels = () => {
    const labels = {
      'en': { playgrounds: 'Playgrounds', toddler: 'Toddler', accessible: 'Accessible', waterPlay: 'Water Play', locateMe: 'Find Me' },
      'es': { playgrounds: 'Parques', toddler: 'Pequeños', accessible: 'Accesible', waterPlay: 'Juegos Agua', locateMe: 'Ubicarme' },
      'fr': { playgrounds: 'Aires de Jeux', toddler: 'Tout-petits', accessible: 'Accessible', waterPlay: 'Jeux d\'eau', locateMe: 'Me Localiser' },
      'de': { playgrounds: 'Spielplätze', toddler: 'Kleinkinder', accessible: 'Barrierefrei', waterPlay: 'Wasserspiele', locateMe: 'Mich Finden' },
      'zh': { playgrounds: '游乐场', toddler: '幼儿', accessible: '无障碍', waterPlay: '水上游戏', locateMe: '定位' },
      'ja': { playgrounds: '遊び場', toddler: '幼児', accessible: 'バリアフリー', waterPlay: '水遊び', locateMe: '現在地' },
      'ar': { playgrounds: 'ملاعب', toddler: 'صغار', accessible: 'متاح', waterPlay: 'ألعاب مائية', locateMe: 'موقعي' },
    };
    return labels[language] || labels['en'];
  };

  const labels = getLabels();

  const handleFilterChange = (filterKey: keyof FilterState) => {
    onFiltersChange({
      ...filters,
      [filterKey]: !filters[filterKey]
    });
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Mobile emoji/text toggle */}
      <div className="block md:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsMobileTextMode(!isMobileTextMode)}
          className="mb-2 text-xs"
        >
          {isMobileTextMode ? '🎮' : 'ABC'}
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-col gap-2">
        <Button
          variant={filters.showPlaygrounds ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showPlaygrounds')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏰</span>
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.playgrounds}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showToddlerAreas ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showToddlerAreas')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Baby className="w-4 h-4" />
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.toddler}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showAccessible ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showAccessible')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Wheelchair className="w-4 h-4" />
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.accessible}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showWaterPlay ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showWaterPlay')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4" />
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.waterPlay}
            </span>
          </div>
        </Button>
      </div>

      {/* Locate Me button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLocateMe}
        className="min-h-[48px] justify-start text-left"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
            {labels.locateMe}
          </span>
        </div>
      </Button>
    </div>
  );
}