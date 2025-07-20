import { useState } from "react";
import { X, Navigation, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkerData, UserLocation } from "@/types/map";
import { getDirectionsUrl } from "@/lib/geolocation";
import ReviewDisplay from "./ReviewDisplay";
import ReviewForm from "./ReviewForm";

interface InfoPanelProps {
  markerData: MarkerData | null;
  userLocation: UserLocation | null;
  onClose: () => void;
  language?: string;
}

export default function InfoPanel({ markerData, userLocation, onClose, language = 'en' }: InfoPanelProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  if (!markerData) return null;

  const { amenity, distance } = markerData;
  const isBathroom = amenity.type === 'bathroom';
  const isDogPark = amenity.type === 'dog_park';
  const isShower = amenity.type === 'shower';
  const amenityId = amenity.id ? parseInt(amenity.id) : 0;

  const handleGetDirections = () => {
    if (userLocation) {
      const url = getDirectionsUrl(
        userLocation.lat,
        userLocation.lng,
        amenity.latitude,
        amenity.longitude
      );
      window.open(url, '_blank');
    }
  };

  // Language translations
  const translations = {
    en: {
      publicBathroom: 'Public Bathroom',
      publicFacility: 'Public Facility',
      bathroom: 'Bathroom',
      dogPark: 'Dog Park',
      shower: 'Shower',
      details: 'Details',
      reviews: 'Reviews',
      addReview: 'Add Review',
      directions: 'Directions',
      paid: 'Paid',
      accessible: 'Accessible',
      babyChange: 'Baby Change',
      bidet: 'Bidet',
      toiletPaper: 'Toilet Paper',
      handDryer: 'Hand Dryer',
      sanitaryDisposal: 'Sanitary Disposal',
      selfCleaning: 'Self Cleaning',
      unknown: 'Unknown',
      kmAway: 'km away'
    },
    es: {
      publicBathroom: 'Baño Público',
      publicFacility: 'Instalación Pública',
      bathroom: 'Baño',
      dogPark: 'Parque para Perros',
      shower: 'Ducha',
      details: 'Detalles',
      reviews: 'Reseñas',
      addReview: 'Añadir Reseña',
      directions: 'Direcciones',
      paid: 'De Pago',
      accessible: 'Accesible',
      babyChange: 'Cambiador',
      bidet: 'Bidé',
      toiletPaper: 'Papel Higiénico',
      handDryer: 'Secador',
      sanitaryDisposal: 'Contenedor',
      selfCleaning: 'Autolimpiante',
      unknown: 'Desconocido',
      kmAway: 'km de distancia'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const getStatusText = (value: boolean | null | undefined, positiveText: string, negativeText: string) => {
    if (value === true) return positiveText;
    if (value === false) return negativeText;
    return t.unknown;
  };



  return (
    <Card className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto z-[1000] shadow-lg max-h-[80vh] overflow-y-auto">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isBathroom ? 'bg-orange-600' : isDogPark ? 'bg-green-600' : 'bg-cyan-600'
            }`}>
              {isBathroom ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v16h16V4H4zm8 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
              ) : isDogPark ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM9 8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S11.33 10 10.5 10 9 9.33 9 8.5z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A7,7 0 0,1 19,9C19,10.15 18.85,11.25 18.58,12.31L16.89,11.58C17.11,10.79 17.25,9.97 17.25,9.12C17.25,6.32 15.08,4 12.42,4C9.32,4 6.81,6.25 6.56,9.22L4.82,8.47C5.28,5.07 8.28,2 12,2M8.5,9A1.5,1.5 0 0,1 10,10.5A1.5,1.5 0 0,1 8.5,12A1.5,1.5 0 0,1 7,10.5A1.5,1.5 0 0,1 8.5,9M15.5,9A1.5,1.5 0 0,1 17,10.5A1.5,1.5 0 0,1 15.5,12A1.5,1.5 0 0,1 14,10.5A1.5,1.5 0 0,1 15.5,9M12,14L13.5,22H10.5L12,14Z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {amenity.name || (isBathroom ? t.publicBathroom : t.publicFacility)}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {isBathroom ? t.bathroom : isDogPark ? t.dogPark : t.shower}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">{t.details}</TabsTrigger>
            <TabsTrigger value="reviews">{t.reviews}</TabsTrigger>
            <TabsTrigger value="add-review">{t.addReview}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="mt-4">

            {/* Feature badges - comprehensive tagging for all features */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Fee status - universal */}
              {amenity.fee === false && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                  💰 {language === 'es' ? 'Gratis' : 'Free'}
                </span>
              )}
              {amenity.fee === true && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                  💰 {t.paid}
                </span>
              )}
              
              {/* Wheelchair accessibility - universal */}
              {amenity.wheelchair === true && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  ♿ {t.accessible}
                </span>
              )}
              
              {/* Bathroom-specific features */}
              {isBathroom && (
                <>
                  {amenity.changingTable === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                      👶 {t.babyChange}
                    </span>
                  )}
                  {amenity.bidet === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                      🚿 {t.bidet}
                    </span>
                  )}
                  {amenity.toiletPaper === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">
                      🧻 {t.toiletPaper}
                    </span>
                  )}
                  {amenity.handDryer === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-600 text-white">
                      🌬️ {t.handDryer}
                    </span>
                  )}
                  {amenity.sanitaryDisposal === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-600 text-white">
                      🗑️ {t.sanitaryDisposal}
                    </span>
                  )}
                  {amenity.selfCleaning === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
                      🧽 {t.selfCleaning}
                    </span>
                  )}
                </>
              )}
              
              {/* Dog park-specific features */}
              {isDogPark && (
                <>
                  {amenity.offLeash === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      🐕 Off-leash
                    </span>
                  )}
                  {amenity.dogWasteBins === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-700 text-white">
                      🗑️ Waste Bins
                    </span>
                  )}
                  {amenity.drinkingWater === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-600 text-white">
                      💧 Water
                    </span>
                  )}
                  {amenity.barrier === 'fence' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">
                      🚧 Fenced
                    </span>
                  )}
                </>
              )}
              
              {/* Shower-specific features */}
              {isShower && (
                <>
                  {amenity.hotWater === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                      🔥 Hot Water
                    </span>
                  )}
                  {amenity.covered === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">
                      🏠 Covered
                    </span>
                  )}
                  {amenity.building === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600 text-white">
                      🏢 Indoor
                    </span>
                  )}
                  {amenity.supervised === true && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                      👮 Supervised
                    </span>
                  )}
                  {amenity.gender === 'unisex' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                      🚻 Unisex
                    </span>
                  )}
                  {amenity.gender === 'male' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      🚹 Male Only
                    </span>
                  )}
                  {amenity.gender === 'female' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-600 text-white">
                      🚺 Female Only
                    </span>
                  )}
                  {amenity.accessType === 'yes' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                      🔓 Public Access
                    </span>
                  )}
                  {amenity.accessType === 'customers' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-600 text-white">
                      🛒 Customers Only
                    </span>
                  )}
                  {amenity.accessType === 'private' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                      🔒 Private
                    </span>
                  )}
                </>
              )}
              
              {/* Operator tagging - for all types */}
              {amenity.operator && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                  🏛️ {amenity.operator}
                </span>
              )}
            </div>

            {distance && (
              <p className="text-sm text-gray-600 mb-3">📍 {distance.toFixed(1)} {t.kmAway}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {userLocation && (
                <Button 
                  onClick={handleGetDirections}
                  className="flex-1"
                  size="sm"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  {t.directions}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            {isBathroom && amenityId && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">User Reviews</span>
                </div>
                <ReviewDisplay amenityId={amenityId} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-review" className="mt-4">
            {isBathroom && (
              <ReviewForm 
                amenity={amenity} 
                onClose={() => setShowReviewForm(false)}
                onSuccess={() => setShowReviewForm(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}