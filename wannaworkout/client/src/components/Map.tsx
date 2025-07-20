import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchWorkoutEquipment } from "@/lib/api";
import { calculateDistance } from "@/lib/geolocation";
import { FilterState, Amenity, UserLocation } from "@/types/map";
import { useToast } from "@/hooks/use-toast";

// Fix for default marker icons in webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  filters: FilterState;
  userLocation: UserLocation | null;
  searchLocation: { lat: number; lng: number } | null;
  onMarkerClick: (amenity: Amenity) => void;
  language?: string;
}

export default function Map({ filters, userLocation, searchLocation, onMarkerClick, language = 'en' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentBounds, setCurrentBounds] = useState<{swLat: number, swLng: number, neLat: number, neLng: number} | null>(null);
  const { toast } = useToast();

  // Fetch workout equipment data
  const { data: workoutEquipment = [], isLoading: workoutEquipmentLoading, error: workoutEquipmentError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/workout-equipment', currentBounds] : ['/api/amenities/workout-equipment'],
    queryFn: () => {
      const bounds = currentBounds ? `${currentBounds.swLat},${currentBounds.swLng},${currentBounds.neLat},${currentBounds.neLng}` : undefined;
      return fetchWorkoutEquipment(bounds);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!currentBounds, // Only fetch when we have bounds
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [0, 0], // Neutral start - will be set by geolocation
      zoom: 2,
    });

    // Add initial tile layer
    const getTileUrl = (lang: string) => {
      const cacheBust = Date.now();
      return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
    };

    tileLayerRef.current = L.tileLayer(getTileUrl(language), {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Add markers layer
    markersRef.current.addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers when data or filters change
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.clearLayers();

    const allAmenities = [...workoutEquipment];

    // Filter amenities based on current filters
    const filteredAmenities = allAmenities.filter(amenity => {
      if (!filters.showWorkoutEquipment && amenity.type === 'fitness_station') return false;
      if (!filters.showOutdoorGym && (amenity.equipmentType === 'outdoor_gym' || amenity.type === 'outdoor_gym')) return false;
      if (!filters.showFitnessStations && amenity.equipmentType === 'fitness_station') return false;
      if (!filters.showAccessible && !amenity.wheelchair) return false;
      return true;
    });

    // Create markers for filtered amenities
    filteredAmenities.forEach(amenity => {
      const lat = amenity.latitude;
      const lng = amenity.longitude;

      let iconColor = '#3b82f6'; // Blue for fitness stations
      let emoji = '🏋️';

      if (amenity.equipmentType === 'outdoor_gym') {
        iconColor = '#10b981'; // Green for outdoor gyms
        emoji = '🌳';
      } else if (amenity.wheelchair) {
        iconColor = '#6366f1'; // Purple for accessible
        emoji = '♿';
      }

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${iconColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindTooltip(amenity.name || 'Fitness Equipment', {
          permanent: false,
          direction: 'top',
          offset: [0, -15]
        })
        .on('click', () => {
          onMarkerClick(amenity);
        });

      markersRef.current.addLayer(marker);
    });

    console.log(`🏋️ Added ${filteredAmenities.length} workout equipment markers`);
  }, [workoutEquipment, filters, onMarkerClick]);

  // Handle user location
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
    }

    // Add user location marker
    const userIcon = L.divIcon({
      html: '<div style="background-color: #ef4444; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: 'user-location-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindTooltip('Your Location', { permanent: false, direction: 'top' })
      .addTo(mapInstance.current);

    // Set map view to user location
    mapInstance.current.setView([userLocation.lat, userLocation.lng], 15);
    
    // Update bounds for dynamic data fetching
    const bounds = mapInstance.current.getBounds();
    setCurrentBounds({
      swLat: bounds.getSouth(),
      swLng: bounds.getWest(),
      neLat: bounds.getNorth(),
      neLng: bounds.getEast()
    });

    console.log(`🎯 Setting map to user location:`, userLocation);
  }, [userLocation]);

  // Handle search location
  useEffect(() => {
    if (!mapInstance.current || !searchLocation) return;

    mapInstance.current.setView([searchLocation.lat, searchLocation.lng], 15);
    
    // Update bounds for dynamic data fetching
    const bounds = mapInstance.current.getBounds();
    setCurrentBounds({
      swLat: bounds.getSouth(),
      swLng: bounds.getWest(),
      neLat: bounds.getNorth(),
      neLng: bounds.getEast()
    });

    console.log(`🔍 Setting map to search location:`, searchLocation);
  }, [searchLocation]);

  // Update tile layer when language changes
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;

    console.log(`🗺️ Updating map tiles for language: ${language}`);
    
    const getTileUrl = (lang: string) => {
      const cacheBust = Date.now();
      return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
    };

    // Remove current tile layer
    mapInstance.current.removeLayer(tileLayerRef.current);
    
    // Add new tile layer with updated URL
    tileLayerRef.current = L.tileLayer(getTileUrl(language), {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    console.log(`🏷️ Refreshing markers for language: ${language}`);
  }, [language]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {workoutEquipmentLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-lg">
          Loading workout equipment...
        </div>
      )}
      {workoutEquipmentError && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 p-2 rounded">
          Error loading data. Please try again.
        </div>
      )}
    </div>
  );
}