import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Amenity } from "@/types/map";

interface InfoPanelProps {
  amenity: Amenity;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function InfoPanel({ amenity, onClose, userLocation }: InfoPanelProps) {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = userLocation 
    ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
    : null;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${amenity.latitude},${amenity.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-6 z-[1000] max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 pr-4">{amenity.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 h-8 w-8 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            🕌 Prayer Room
          </span>
          
          {amenity.denomination && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {amenity.denomination === 'muslim' ? '☪️ Islamic' : amenity.denomination === 'christian' ? '✝️ Christian' : `📿 ${amenity.denomination}`}
            </span>
          )}
          
          {amenity.wheelchair && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ♿ Accessible
            </span>
          )}
          
          {amenity.ablutionFacilities && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
              🚿 Ablution
            </span>
          )}
          
          {amenity.prayerMats && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              🧘 Prayer Mats
            </span>
          )}
          
          {amenity.qiblaDirection && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              🧭 Qibla Direction
            </span>
          )}
          
          {amenity.quietSpace && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              🤫 Quiet Space
            </span>
          )}
          
          {amenity.shoesRemoval && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              👟 Shoes Removal
            </span>
          )}
          
          {amenity.fee && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              💰 Fee Required
            </span>
          )}
        </div>

        {amenity.openingHours && (
          <div className="text-sm text-gray-600">
            <strong>Hours:</strong> {amenity.openingHours}
          </div>
        )}

        {amenity.capacity && (
          <div className="text-sm text-gray-600">
            <strong>Capacity:</strong> {amenity.capacity} people
          </div>
        )}

        {amenity.operator && (
          <div className="text-sm text-gray-600">
            <strong>Operator:</strong> {amenity.operator}
          </div>
        )}

        {distance && (
          <div className="text-sm text-gray-600">
            <strong>Distance:</strong> {distance.toFixed(1)} km away
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={openDirections}
            className="flex-1"
            size="sm"
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}