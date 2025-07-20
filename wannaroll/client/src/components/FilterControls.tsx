import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, Award } from "lucide-react";
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
      'en': { skatePark: 'Skate Parks', bmx: 'BMX', beginner: 'Beginner', advanced: 'Advanced', locateMe: 'Find Me' },
      'es': { skatePark: 'Skate Parks', bmx: 'BMX', beginner: 'Principiante', advanced: 'Avanzado', locateMe: 'Ubicarme' },
      'fr': { skatePark: 'Skate Parks', bmx: 'BMX', beginner: 'Débutant', advanced: 'Avancé', locateMe: 'Me Localiser' },
      'de': { skatePark: 'Skate Parks', bmx: 'BMX', beginner: 'Anfänger', advanced: 'Fortgeschritten', locateMe: 'Mich Finden' },
      'zh': { skatePark: '滑板公园', bmx: 'BMX', beginner: '初学者', advanced: '高级', locateMe: '定位' },
      'ja': { skatePark: 'スケートパーク', bmx: 'BMX', beginner: '初心者', advanced: '上級者', locateMe: '現在地' },
      'ar': { skatePark: 'حدائق التزلج', bmx: 'BMX', beginner: 'مبتدئ', advanced: 'متقدم', locateMe: 'موقعي' },
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
          {isMobileTextMode ? '🛹' : 'ABC'}
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-col gap-2">
        <Button
          variant={filters.showSkatePark ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showSkatePark')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🛹</span>
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.skatePark}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showBMX ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showBMX')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🚴</span>
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.bmx}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showBeginner ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showBeginner')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.beginner}
            </span>
          </div>
        </Button>

        <Button
          variant={filters.showAdvanced ? "default" : "secondary"}
          size="sm"
          onClick={() => handleFilterChange('showAdvanced')}
          className="min-h-[48px] justify-start text-left whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className={`${isMobileTextMode ? 'hidden' : 'block'} md:block text-xs`}>
              {labels.advanced}
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