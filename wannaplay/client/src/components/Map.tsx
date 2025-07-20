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
async function fetchPlaygrounds(bounds?: string): Promise<Amenity[]> {
  // For now, return mock playground data
  // In production, this would query Overpass API for leisure=playground
  const mockPlaygrounds: Amenity[] = [
    {
      id: "playground_1",
      name: "Sunny Park Playground",
      lat: 1.3521,
      lng: 103.8198,
      type: 'playground',
      ageGroup: 'children',
      equipment: ['swings', 'slides', 'climbing frame', 'sandbox'],
      surfacing: 'rubber',
      fenced: true,
      shaded: true,
      restrooms: true,
      parking: true,
      accessible: true,
      operator: "Singapore Parks"
    },
    {
      id: "playground_2", 
      name: "Toddler Fun Zone",
      lat: 1.3421,
      lng: 103.8298,
      type: 'playground',
      ageGroup: 'toddler',
      equipment: ['mini slides', 'spring riders', 'sandbox'],
      surfacing: 'sand',
      fenced: true,
      shaded: false,
      restrooms: false,
      parking: true,
      accessible: false,
      waterPlay: true
    }
  ];
  
  return mockPlaygrounds;
}

export default function Map({ filters, userLocation, searchLocation, onMarkerClick, language = 'en' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentBounds, setCurrentBounds] = useState<{swLat: number, swLng: number, neLat: number, neLng: number} | null>(null);
  const { toast } = useToast();

  // Fetch playground data (global bounds)
  const { data: playgrounds = [], isLoading: playgroundsLoading, error: playgroundsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/playgrounds', currentBounds] : ['/api/amenities/playgrounds'],
    queryFn: () => {
      const bounds = currentBounds ? `${currentBounds.swLat},${currentBounds.swLng},${currentBounds.neLat},${currentBounds.neLng}` : undefined;
      return fetchPlaygrounds(bounds);
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

    const allAmenities = [...playgrounds];

    // Filter amenities based on current filters
    const filteredAmenities = allAmenities.filter(amenity => {
      if (amenity.type === 'playground' && !filters.showPlaygrounds) return false;
      if (amenity.ageGroup === 'toddler' && !filters.showToddlerAreas) return false;
      if (amenity.accessible && !filters.showAccessible) return false;
      if (amenity.waterPlay && !filters.showWaterPlay) return false;
      return true;
    });

    console.log(`🏷️ Refreshing markers for language: ${language}`);

    // Add markers for filtered amenities
    filteredAmenities.forEach(amenity => {
      const getMarkerColor = () => {
        if (amenity.ageGroup === 'toddler') return '#ec4899'; // Pink for toddlers
        if (amenity.waterPlay) return '#06b6d4'; // Cyan for water play
        if (amenity.accessible) return '#3b82f6'; // Blue for accessible
        return '#10b981'; // Green for regular playgrounds
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
            <span style="color: white; font-size: 12px;">🏰</span>
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
  }, [playgrounds, filters, onMarkerClick, language]);

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