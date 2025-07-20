import { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FilterState, UserLocation, Amenity } from "@/types/map";

// Fix Leaflet default marker icons
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

// Mock data fetcher function - will use real Overpass API data
async function fetchSkateParks(bounds?: string): Promise<Amenity[]> {
  // For now, return mock skate park data
  // In production, this would query Overpass API for sport=skateboard
  const mockSkateParks: Amenity[] = [
    {
      id: "skate_1",
      name: "Downtown Skate Plaza",
      lat: 1.3521,
      lng: 103.8198,
      type: 'skate_park',
      skateParkType: 'street',
      features: ['rails', 'stairs', 'ledges', 'manual pads'],
      surface: 'concrete',
      difficulty: 'intermediate',
      lighting: true,
      covered: false,
      restrooms: true,
      parking: true,
      operator: "City Parks"
    },
    {
      id: "skate_2", 
      name: "Vert Ramp Arena",
      lat: 1.3421,
      lng: 103.8298,
      type: 'skate_park',
      skateParkType: 'vert',
      features: ['halfpipe', 'mini ramp', 'vert ramp'],
      surface: 'wood',
      difficulty: 'advanced',
      lighting: true,
      covered: true,
      restrooms: true,
      parking: true,
      waterFountain: true,
      fee: true
    }
  ];
  
  return mockSkateParks;
}

export default function Map({ filters, userLocation, searchLocation, onMarkerClick, language = 'en' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentBounds, setCurrentBounds] = useState<{swLat: number, swLng: number, neLat: number, neLng: number} | null>(null);
  const { toast } = useToast();

  // Fetch skate park data (global bounds)
  const { data: skateParks = [], isLoading: skateParksLoading, error: skateParksError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/skate-parks', currentBounds] : ['/api/amenities/skate-parks'],
    queryFn: () => {
      const bounds = currentBounds ? `${currentBounds.swLat},${currentBounds.swLng},${currentBounds.neLat},${currentBounds.neLng}` : undefined;
      return fetchSkateParks(bounds);
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

    // Update bounds when map moves
    const updateBounds = () => {
      if (mapInstance.current) {
        const bounds = mapInstance.current.getBounds();
        setCurrentBounds({
          swLat: bounds.getSouth(),
          swLng: bounds.getWest(),
          neLat: bounds.getNorth(),
          neLng: bounds.getEast()
        });
      }
    };

    mapInstance.current.on('moveend', updateBounds);
    mapInstance.current.on('zoomend', updateBounds);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update tile layer when language changes
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;

    console.log(`🗺️ Updating map tiles for language: ${language}`);
    
    const getTileUrl = (lang: string) => {
      const cacheBust = Date.now();
      return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
    };

    // Remove old tile layer and add new one
    mapInstance.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(getTileUrl(language), {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, [language]);

  // Update markers when data or filters change
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.clearLayers();

    const allAmenities = [...skateParks];

    // Filter amenities based on current filters
    const filteredAmenities = allAmenities.filter(amenity => {
      if (amenity.type === 'skate_park' && !filters.showSkatePark) return false;
      if (amenity.type === 'bmx' && !filters.showBMX) return false;
      if (amenity.difficulty === 'beginner' && !filters.showBeginner) return false;
      if (amenity.difficulty === 'advanced' && !filters.showAdvanced) return false;
      return true;
    });

    console.log(`🏷️ Refreshing markers for language: ${language}`);

    // Add markers for filtered amenities
    filteredAmenities.forEach(amenity => {
      const getMarkerColor = () => {
        if (amenity.difficulty === 'beginner') return '#10b981'; // Green for beginner
        if (amenity.difficulty === 'advanced') return '#ef4444'; // Red for advanced
        if (amenity.skateParkType === 'bowl') return '#8b5cf6'; // Purple for bowls
        if (amenity.skateParkType === 'vert') return '#f59e0b'; // Orange for vert
        return '#3b82f6'; // Blue for street/default
      };

      const markerIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${getMarkerColor()};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="color: white; font-size: 12px;">🛹</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: 'custom-marker'
      });

      const marker = L.marker([amenity.lat, amenity.lng], { icon: markerIcon })
        .on('click', () => onMarkerClick(amenity));

      markersRef.current.addLayer(marker);
    });
  }, [skateParks, filters, onMarkerClick, language]);

  // Set map location based on user location
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    console.log('🎯 Setting map to user location:', userLocation);

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
    }

    // Add user location marker
    const userIcon = L.divIcon({
      html: `
        <div style="
          background-color: #ef4444;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: 'user-location-marker'
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstance.current);

    // Center map on user location
    mapInstance.current.setView([userLocation.lat, userLocation.lng], 15);

    // Log the current center for debugging
    setTimeout(() => {
      if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        console.log('📍 Map center after refresh:', { lat: center.lat, lng: center.lng });
      }
    }, 100);
  }, [userLocation]);

  // Set map location based on search location
  useEffect(() => {
    if (!mapInstance.current || !searchLocation) return;

    console.log('🔍 Setting map to search location:', searchLocation);
    mapInstance.current.setView([searchLocation.lat, searchLocation.lng], 15);
  }, [searchLocation]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '100vh' }}
    />
  );
}