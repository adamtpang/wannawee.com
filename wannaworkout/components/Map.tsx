import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchBathrooms, fetchDogParks, fetchShowers, fetchBathroomsForBounds, fetchDogParksForBounds, fetchShowersForBounds } from "@/lib/overpass";
import { calculateDistance } from "@/lib/geolocation";
import { FilterState, MapAmenity, UserLocation, MarkerData } from "@/types/map";
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
  onMarkerClick: (markerData: MarkerData) => void;
  language?: string;
}

const SF_CENTER = [37.7749, -122.4194] as const;
const SF_BOUNDS = [
  [37.70, -122.55], // Southwest
  [37.83, -122.35]  // Northeast
] as const;

export default function Map({ filters, userLocation, searchLocation, onMarkerClick, language = 'en' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentBounds, setCurrentBounds] = useState<{swLat: number, swLng: number, neLat: number, neLng: number} | null>(null);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const { toast } = useToast();

  // Fetch bathroom data (SF default or global bounds)
  const { data: bathrooms = [], isLoading: bathroomsLoading, error: bathroomsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/bathrooms/bounds', currentBounds] : ['/api/amenities/bathrooms'],
    queryFn: currentBounds 
      ? () => fetchBathroomsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchBathrooms,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Fetch dog park data (SF default or global bounds)
  const { data: dogParks = [], isLoading: dogParksLoading, error: dogParksError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/dog-parks/bounds', currentBounds] : ['/api/amenities/dog-parks'],
    queryFn: currentBounds 
      ? () => fetchDogParksForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchDogParks,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Fetch shower data (SF default or global bounds)
  const { data: showers = [], isLoading: showersLoading, error: showersError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/showers/bounds', currentBounds] : ['/api/amenities/showers'],
    queryFn: currentBounds 
      ? () => fetchShowersForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchShowers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [0, 0], // Neutral start - will be set by geolocation
      zoom: 2,
    });

    // Add initial tile layer - will be updated based on language
    const getTileUrl = (lang: string) => {
      // Cache busting parameter to force fresh tiles
      const cacheBust = Date.now();
      
      // Use language-specific tile sources when available
      switch (lang) {
        case 'ar':
          // For Arabic, use a tile server that shows local names
          return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
        case 'zh':
          // For Chinese, use a tile server that shows local names  
          return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
        case 'ja':
          // For Japanese, use a tile server that shows local names
          return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
        case 'ko':
          // For Korean, use a tile server that shows local names
          return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
        default:
          // For English and other languages, use standard OSM
          return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
      }
    };

    tileLayerRef.current = L.tileLayer(getTileUrl(language), {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      updateWhenZooming: false,
      keepBuffer: 0
    }).addTo(mapInstance.current);

    // Add scale control
    L.control.scale({
      position: 'bottomright',
      imperial: false
    }).addTo(mapInstance.current);

    // Add markers layer group
    markersRef.current.addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update tile layer when language changes
  useEffect(() => {
    if (mapInstance.current && tileLayerRef.current) {
      console.log(`🗺️ Updating map tiles for language: ${language}`);
      
      // Remove current tile layer
      mapInstance.current.removeLayer(tileLayerRef.current);
      
      // Create new tile layer with updated language
      const getTileUrl = (lang: string) => {
        const cacheBust = Date.now();
        
        switch (lang) {
          case 'ar':
            return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
          case 'zh':
            return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
          case 'ja':
            return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
          case 'ko':
            return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
          default:
            return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?v=${cacheBust}`;
        }
      };

      // Add new tile layer
      tileLayerRef.current = L.tileLayer(getTileUrl(language), {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        updateWhenZooming: false,
        keepBuffer: 0
      }).addTo(mapInstance.current);
    }
  }, [language]);

  // Calculate loading state
  const isLoading = bathroomsLoading || dogParksLoading || showersLoading;

  // Update markers when language changes to refresh popup content
  useEffect(() => {
    if (mapInstance.current && !isLoading) {
      console.log(`🏷️ Refreshing markers for language: ${language}`);
      
      // Clear existing markers
      markersRef.current.clearLayers();
      
      // Re-add markers with updated language
      if (filters.showBathrooms && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          const marker = createBathroomMarker(amenity, userLocation);
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showBabyChanging && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.changingTable === true) {
            const marker = createBabyChangingMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showBidet && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.bidet === true) {
            const marker = createBidetMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showToiletPaper && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.toiletPaper === true) {
            const marker = createToiletPaperMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showHandDryer && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.handDryer === true) {
            const marker = createHandDryerMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showSanitaryDisposal && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.sanitaryDisposal === true) {
            const marker = createSanitaryDisposalMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showWheelchairAccessible && bathrooms.length > 0) {
        bathrooms.forEach((amenity: MapAmenity) => {
          if (amenity.wheelchair === true) {
            const marker = createWheelchairAccessibleMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          }
        });
      }

      if (filters.showDogParks && dogParks.length > 0) {
        dogParks.forEach((amenity: MapAmenity) => {
          const marker = createDogParkMarker(amenity, userLocation);
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showShowers && showers.length > 0) {
        showers.forEach((amenity: MapAmenity) => {
          const marker = createShowerMarker(amenity, userLocation);
          markersRef.current.addLayer(marker);
        });
      }
    }
  }, [language, bathrooms, dogParks, showers, filters, userLocation, isLoading]);

  // Handle errors
  useEffect(() => {
    if (bathroomsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Bathrooms",
        description: "Failed to load bathroom data. Please check your internet connection.",
      });
    }
  }, [bathroomsError, toast]);

  useEffect(() => {
    if (dogParksError) {
      toast({
        variant: "destructive",
        title: "Error Loading Dog Parks", 
        description: "Failed to load dog park data. Please check your internet connection.",
      });
    }
  }, [dogParksError, toast]);

  useEffect(() => {
    if (showersError) {
      toast({
        variant: "destructive",
        title: "Error Loading Showers", 
        description: "Failed to load shower data. Please check your internet connection.",
      });
    }
  }, [showersError, toast]);

  // Handle search location changes for global data fetching
  useEffect(() => {
    if (!searchLocation) return;

    // Check if this location is outside SF bounds - if so, fetch global data
    const isSF = searchLocation.lat >= SF_BOUNDS[0][0] && 
                 searchLocation.lat <= SF_BOUNDS[1][0] && 
                 searchLocation.lng >= SF_BOUNDS[0][1] && 
                 searchLocation.lng <= SF_BOUNDS[1][1];

    if (!isSF) {
      // Calculate bounds around the search location (approximately 10km radius)
      const offset = 0.1; // Roughly 10km
      const bounds = {
        swLat: searchLocation.lat - offset,
        swLng: searchLocation.lng - offset,
        neLat: searchLocation.lat + offset,
        neLng: searchLocation.lng + offset
      };
      setCurrentBounds(bounds);
      setIsGlobalSearch(true);
    } else {
      // Reset to SF data
      setCurrentBounds(null);
      setIsGlobalSearch(false);
    }
  }, [searchLocation]);

  // Update markers when data or filters change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add bathroom markers
    if (filters.showBathrooms && bathrooms.length > 0) {
      bathrooms.forEach((amenity: MapAmenity) => {
        // Skip if this bathroom has special features and those filters are on
        if (filters.showBathroomsWithChanging && amenity.changingTable === true) {
          return; // Will be handled by the baby changing filter
        }
        if (filters.showWheelchairAccessible && amenity.wheelchair === true) {
          return; // Will be handled by the wheelchair accessible filter
        }
        
        const marker = createBathroomMarker(amenity, userLocation);
        marker.on('click', () => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
            : undefined;
          onMarkerClick({ amenity, distance });
        });
        markersRef.current.addLayer(marker);
      });
    }

    // Add bathroom markers with baby changing tables
    if (filters.showBathroomsWithChanging && bathrooms.length > 0) {
      bathrooms.forEach((amenity: MapAmenity) => {
        if (amenity.changingTable === true) {
          // Skip if this is also wheelchair accessible and that filter is on
          if (filters.showWheelchairAccessible && amenity.wheelchair === true) {
            return; // Will be handled by wheelchair accessible filter
          }
          
          const marker = createBabyChangingMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        }
      });
    }

    // Add wheelchair accessible bathroom markers
    if (filters.showWheelchairAccessible && bathrooms.length > 0) {
      bathrooms.forEach((amenity: MapAmenity) => {
        if (amenity.wheelchair === true) {
          const marker = createWheelchairAccessibleMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        }
      });
    }

    // Add dog park markers
    if (filters.showDogParks && dogParks.length > 0) {
      dogParks.forEach((amenity: MapAmenity) => {
        const marker = createDogParkMarker(amenity, userLocation);
        marker.on('click', () => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
            : undefined;
          onMarkerClick({ amenity, distance });
        });
        markersRef.current.addLayer(marker);
      });
    }

    // Add shower markers
    if (filters.showShowers && showers.length > 0) {
      showers.forEach((amenity: MapAmenity) => {
        const marker = createShowerMarker(amenity, userLocation);
        marker.on('click', () => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
            : undefined;
          onMarkerClick({ amenity, distance });
        });
        markersRef.current.addLayer(marker);
      });
    }
  }, [filters, bathrooms, dogParks, showers, userLocation, onMarkerClick]);

  // Update user location marker and center map
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    console.log('🎯 Setting map to user location:', userLocation);

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
    }

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `<div style="background-color: #2563eb; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstance.current);

    // Force map to center on user location (override any previous positioning)
    mapInstance.current.setView([userLocation.lat, userLocation.lng], 15, { animate: false });
    
    // Force complete map refresh for browser compatibility
    setTimeout(() => {
      if (mapInstance.current) {
        // Force map size recalculation
        mapInstance.current.invalidateSize(true);
        
        // Force a hard positioning with no animation
        mapInstance.current.setView([userLocation.lat, userLocation.lng], 15, { 
          animate: false,
          reset: true
        });
        
        // Additional positioning verification
        const currentCenter = mapInstance.current.getCenter();
        console.log('📍 Map center after refresh:', currentCenter);
        
        // If position is still not correct, try one more time with pan
        if (Math.abs(currentCenter.lat - userLocation.lat) > 0.01) {
          console.log('🔄 Applying secondary positioning...');
          mapInstance.current.panTo([userLocation.lat, userLocation.lng]);
        }
      }
    }, 500);
  }, [userLocation]);

  // Handle search location (only for manual searches, not initial user location)
  useEffect(() => {
    if (!mapInstance.current || !searchLocation) return;

    // Only center map if this is not the same as user location (manual search)
    if (userLocation && 
        Math.abs(searchLocation.lat - userLocation.lat) < 0.001 && 
        Math.abs(searchLocation.lng - userLocation.lng) < 0.001) {
      // This is the user's location, don't interfere with user location centering
      return;
    }

    // For manual searches, use smooth animation
    mapInstance.current.setView([searchLocation.lat, searchLocation.lng], 15, { animate: true });
  }, [searchLocation, userLocation]);

  const createBathroomMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #ea580c; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M4 4v16h16V4H4zm8 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createDogParkMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #16a34a; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M4.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM9 8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S11.33 10 10.5 10 9 9.33 9 8.5z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createDogParkPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createBabyChangingMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #9333ea; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createWheelchairAccessibleMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #2563eb; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createShowerMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #0891b2; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2A7,7 0 0,1 19,9C19,10.15 18.85,11.25 18.58,12.31L16.89,11.58C17.11,10.79 17.25,9.97 17.25,9.12C17.25,6.32 15.08,4 12.42,4C9.32,4 6.81,6.25 6.56,9.22L4.82,8.47C5.28,5.07 8.28,2 12,2M8.5,9A1.5,1.5 0 0,1 10,10.5A1.5,1.5 0 0,1 8.5,12A1.5,1.5 0 0,1 7,10.5A1.5,1.5 0 0,1 8.5,9M15.5,9A1.5,1.5 0 0,1 17,10.5A1.5,1.5 0 0,1 15.5,12A1.5,1.5 0 0,1 14,10.5A1.5,1.5 0 0,1 15.5,9M12,14L13.5,22H10.5L12,14Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createShowerPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createBidetMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #6366f1; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2C13.11,2 14,2.9 14,4C14,5.11 13.11,6 12,6C10.89,6 10,5.11 10,4C10,2.9 10.89,2 12,2M21,9V7L15,1H9V3H13.5L18.5,8H9C7.89,8 7,8.89 7,10V16C7,17.11 7.89,18 9,18H15C16.11,18 17,17.11 17,16V14H19V22H21V9Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createToiletPaperMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #eab308; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V15H11V17M11,13H13V7H11V13Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createHandDryerMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #ec4899; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M17,16V4A2,2 0 0,0 15,2H5A2,2 0 0,0 3,4V16A2,2 0 0,0 5,18H9V20A2,2 0 0,0 11,22H13A2,2 0 0,0 15,20V18H15A2,2 0 0,0 17,16M15,16H5V4H15V16Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createSanitaryDisposalMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #14b8a6; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createBathroomPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  // Language translations for popup content
  const getPopupLabels = (lang: string) => {
    const labels = {
      en: {
        kmAway: 'km away',
        accessible: 'Accessible',
        babyChange: 'Baby Change',
        free: 'Free',
        fee: 'Fee',
        accessibility: 'Accessibility',
        babyChanging: 'Baby Changing',
        hours: 'Hours',
        fencing: 'Fencing',
        wasteBins: 'Waste Bins',
        required: 'Required',
        yes: 'Yes',
        no: 'No',
        available: 'Available',
        notAvailable: 'Not available',
        unknown: 'Unknown',
        fenced: 'Fenced',
        checkOnSite: 'Check on-site'
      },
      ar: {
        kmAway: 'كم',
        accessible: 'متاح',
        babyChange: 'تغيير طفل',
        free: 'مجاني',
        fee: 'رسوم',
        accessibility: 'إمكانية الوصول',
        babyChanging: 'تغيير الطفل',
        hours: 'ساعات',
        fencing: 'سياج',
        wasteBins: 'صناديق القمامة',
        required: 'مطلوب',
        yes: 'نعم',
        no: 'لا',
        available: 'متاح',
        notAvailable: 'غير متاح',
        unknown: 'غير معروف',
        fenced: 'مسيج',
        checkOnSite: 'تحقق في الموقع'
      },
      es: {
        kmAway: 'km de distancia',
        accessible: 'Accesible',
        babyChange: 'Cambio de bebé',
        free: 'Gratis',
        fee: 'Tarifa',
        accessibility: 'Accesibilidad',
        babyChanging: 'Cambio de bebé',
        hours: 'Horario',
        fencing: 'Cercado',
        wasteBins: 'Contenedores de basura',
        required: 'Requerido',
        yes: 'Sí',
        no: 'No',
        available: 'Disponible',
        notAvailable: 'No disponible',
        unknown: 'Desconocido',
        fenced: 'Cercado',
        checkOnSite: 'Verificar en sitio'
      },
      zh: {
        kmAway: '公里远',
        accessible: '无障碍',
        babyChange: '婴儿更换',
        free: '免费',
        fee: '费用',
        accessibility: '无障碍设施',
        babyChanging: '婴儿更换台',
        hours: '开放时间',
        fencing: '围栏',
        wasteBins: '垃圾箱',
        required: '需要',
        yes: '是',
        no: '否',
        available: '可用',
        notAvailable: '不可用',
        unknown: '未知',
        fenced: '有围栏',
        checkOnSite: '现场查看'
      },
      ja: {
        kmAway: 'km離れた',
        accessible: 'アクセス可能',
        babyChange: 'ベビーチェンジ',
        free: '無料',
        fee: '料金',
        accessibility: 'アクセシビリティ',
        babyChanging: 'ベビーチェンジ',
        hours: '営業時間',
        fencing: 'フェンス',
        wasteBins: 'ゴミ箱',
        required: '必要',
        yes: 'はい',
        no: 'いいえ',
        available: '利用可能',
        notAvailable: '利用不可',
        unknown: '不明',
        fenced: 'フェンス有り',
        checkOnSite: '現地確認'
      },
      ko: {
        kmAway: 'km 떨어짐',
        accessible: '접근 가능',
        babyChange: '기저귀 교환',
        free: '무료',
        fee: '요금',
        accessibility: '접근성',
        babyChanging: '기저귀 교환대',
        hours: '운영시간',
        fencing: '울타리',
        wasteBins: '쓰레기통',
        required: '필요',
        yes: '예',
        no: '아니오',
        available: '이용 가능',
        notAvailable: '이용 불가',
        unknown: '알 수 없음',
        fenced: '울타리 있음',
        checkOnSite: '현장 확인'
      }
    };
    return labels[lang] || labels.en;
  };

  const createBathroomPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.changingTable === true) {
      features.push(`<span style="background-color: #9333ea; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">👶 ${labels.babyChange}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #ea580c;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>${labels.fee}:</strong> ${amenity.fee === true ? labels.required : amenity.fee === false ? labels.free : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.yes : amenity.wheelchair === false ? labels.no : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.babyChanging}:</strong> ${amenity.changingTable === true ? labels.available : amenity.changingTable === false ? labels.notAvailable : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
        </div>
      </div>
    `;
  };

  const createDogParkPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    return `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #16a34a;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>${labels.fencing}:</strong> ${amenity.barrier === 'fence' ? labels.fenced : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>Off-leash:</strong> ${amenity.offLeash === true ? labels.available : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>Water:</strong> ${amenity.drinkingWater === true ? labels.available : amenity.drinkingWater === false ? labels.notAvailable : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.wasteBins}:</strong> ${amenity.dogWasteBins === true ? labels.available : amenity.dogWasteBins === false ? labels.notAvailable : labels.unknown}</p>
        </div>
      </div>
    `;
  };

  const createShowerPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.hotWater === true) {
      features.push(`<span style="background-color: #dc2626; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">🔥 Hot Water</span>`);
    }
    if (amenity.covered === true) {
      features.push(`<span style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">🏠 Covered</span>`);
    }
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #0891b2;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Access:</strong> ${amenity.accessType === 'yes' ? 'Public' : amenity.accessType === 'customers' ? 'Customers only' : amenity.accessType === 'private' ? 'Private' : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>Hot Water:</strong> ${amenity.hotWater === true ? labels.yes : amenity.hotWater === false ? 'Cold only' : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.fee}:</strong> ${amenity.fee === true ? labels.required : amenity.fee === false ? labels.free : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>Gender:</strong> ${amenity.gender === 'male' ? 'Male only' : amenity.gender === 'female' ? 'Female only' : amenity.gender === 'unisex' ? 'Unisex' : labels.checkOnSite}</p>
          ${amenity.building === true ? '<p style="margin: 4px 0;"><strong>Indoor facility</strong></p>' : ''}
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-gray-700 font-medium">Loading amenities...</span>
          </div>
        </div>
      )}
    </div>
  );
}
