import { useState } from "react";
import { X, MapPin, Clock, Phone, Globe, Car, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Amenity, UserLocation } from "@/types/map";

interface InfoPanelProps {
  amenity: Amenity;
  onClose: () => void;
  userLocation: UserLocation | null;
}

export default function InfoPanel({ amenity, onClose, userLocation }: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Calculate distance if user location is available
  const calculateDistance = () => {
    if (!userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (amenity.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (amenity.lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(amenity.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const distance = calculateDistance();

  // Get skate park feature badges
  const getFeatureBadges = () => {
    const badges = [];
    
    if (amenity.skateParkType === 'street') badges.push({ label: 'Street Style', color: 'bg-gray-100 text-gray-800', icon: '🏙️' });
    if (amenity.skateParkType === 'vert') badges.push({ label: 'Vert Ramp', color: 'bg-blue-100 text-blue-800', icon: '📐' });
    if (amenity.skateParkType === 'bowl') badges.push({ label: 'Bowl', color: 'bg-purple-100 text-purple-800', icon: '🥣' });
    if (amenity.skateParkType === 'mixed') badges.push({ label: 'Mixed Style', color: 'bg-green-100 text-green-800', icon: '🎯' });
    
    if (amenity.difficulty === 'beginner') badges.push({ label: 'Beginner', color: 'bg-green-100 text-green-800', icon: <Zap className="w-3 h-3" /> });
    if (amenity.difficulty === 'intermediate') badges.push({ label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' });
    if (amenity.difficulty === 'advanced') badges.push({ label: 'Advanced', color: 'bg-red-100 text-red-800', icon: <Award className="w-3 h-3" /> });
    if (amenity.difficulty === 'mixed') badges.push({ label: 'All Levels', color: 'bg-blue-100 text-blue-800', icon: '🎚️' });
    
    if (amenity.lighting) badges.push({ label: 'Lighting', color: 'bg-yellow-100 text-yellow-800', icon: '💡' });
    if (amenity.covered) badges.push({ label: 'Covered', color: 'bg-gray-100 text-gray-800', icon: '🏠' });
    if (amenity.restrooms) badges.push({ label: 'Restrooms', color: 'bg-purple-100 text-purple-800', icon: '🚻' });
    if (amenity.parking) badges.push({ label: 'Parking', color: 'bg-gray-100 text-gray-800', icon: <Car className="w-3 h-3" /> });
    if (amenity.waterFountain) badges.push({ label: 'Water Fountain', color: 'bg-cyan-100 text-cyan-800', icon: '⛲' });
    if (amenity.fee) badges.push({ label: 'Fee Required', color: 'bg-orange-100 text-orange-800', icon: '💰' });
    
    if (amenity.surface) {
      const surfaceColors = {
        'concrete': 'bg-gray-100 text-gray-800',
        'wood': 'bg-orange-100 text-orange-800', 
        'metal': 'bg-blue-100 text-blue-800',
        'mixed': 'bg-purple-100 text-purple-800'
      };
      badges.push({ 
        label: `${amenity.surface.charAt(0).toUpperCase() + amenity.surface.slice(1)} Surface`, 
        color: surfaceColors[amenity.surface] || 'bg-gray-100 text-gray-800',
        icon: '🏁'
      });
    }
    
    return badges;
  };

  const featureBadges = getFeatureBadges();

  return (
    <div className="fixed inset-x-4 bottom-4 bg-white rounded-lg shadow-xl border z-[1001] max-h-[80vh] overflow-hidden md:inset-x-auto md:right-4 md:bottom-4 md:w-96">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {amenity.name || 'Skate Park'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MapPin className="w-4 h-4" />
            <span className="capitalize">{amenity.type.replace('_', ' ')}</span>
            {distance && <span>• {distance}</span>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content with Tabs */}
      <div className="overflow-y-auto max-h-[60vh]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 pt-2">
            <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="px-4 pb-4 space-y-4">
            {/* Feature badges */}
            {featureBadges.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {featureBadges.map((badge, index) => (
                    <Badge key={index} variant="secondary" className={`${badge.color} text-xs flex items-center gap-1`}>
                      {badge.icon}
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {amenity.features && amenity.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {amenity.features.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-3">
              {amenity.openingHours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hours</p>
                    <p className="text-sm text-gray-600">{amenity.openingHours}</p>
                  </div>
                </div>
              )}

              {amenity.operator && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex items-center justify-center mt-0.5">
                    <span className="text-gray-500 text-xs">👥</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Operator</p>
                    <p className="text-sm text-gray-600">{amenity.operator}</p>
                  </div>
                </div>
              )}

              {amenity.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <a href={`tel:${amenity.phone}`} className="text-sm text-blue-600 hover:underline">
                      {amenity.phone}
                    </a>
                  </div>
                </div>
              )}

              {amenity.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Website</p>
                    <a 
                      href={amenity.website.startsWith('http') ? amenity.website : `https://${amenity.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Directions */}
            <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${amenity.lat},${amenity.lng}`;
                  window.open(url, '_blank');
                }}
              >
                Get Directions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}