import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchBathrooms, fetchDogParks, fetchShowers, fetchBathroomsForBounds, fetchDogParksForBounds, fetchShowersForBounds, fetchFitnessStations, fetchFitnessStationsForBounds, fetchOutdoorGyms, fetchOutdoorGymsForBounds, fetchSwimmingPools, fetchSwimmingPoolsForBounds, fetchGyms, fetchGymsForBounds, fetchPlaygrounds, fetchPlaygroundsForBounds, fetchMosques, fetchMosquesForBounds, fetchChurches, fetchChurchesForBounds, fetchPrayerRooms, fetchPrayerRoomsForBounds, fetchWaxingSalons, fetchWaxingSalonsForBounds, fetchNailSalons, fetchNailSalonsForBounds } from "@/lib/overpass";
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
  appType?: string;
}

const SF_CENTER = [37.7749, -122.4194] as const;
const SF_BOUNDS = [
  [37.70, -122.55], // Southwest
  [37.83, -122.35]  // Northeast
] as const;

export default function Map({ filters, userLocation, searchLocation, onMarkerClick, language = 'en', appType = 'wannawee' }: MapProps) {
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

  // Fetch fitness facility data for WannaWorkOut
  const { data: fitnessStations = [], isLoading: fitnessStationsLoading, error: fitnessStationsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/fitness-stations/bounds', currentBounds] : ['/api/amenities/fitness-stations'],
    queryFn: currentBounds 
      ? () => fetchFitnessStationsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchFitnessStations,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannaworkout'
  });

  const { data: outdoorGyms = [], isLoading: outdoorGymsLoading, error: outdoorGymsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/outdoor-gyms/bounds', currentBounds] : ['/api/amenities/outdoor-gyms'],
    queryFn: currentBounds 
      ? () => fetchOutdoorGymsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchOutdoorGyms,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannaworkout'
  });

  const { data: swimmingPools = [], isLoading: swimmingPoolsLoading, error: swimmingPoolsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/swimming-pools/bounds', currentBounds] : ['/api/amenities/swimming-pools'],
    queryFn: currentBounds 
      ? () => fetchSwimmingPoolsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchSwimmingPools,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannaworkout'
  });

  const { data: gyms = [], isLoading: gymsLoading, error: gymsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/gyms/bounds', currentBounds] : ['/api/amenities/gyms'],
    queryFn: currentBounds 
      ? () => fetchGymsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchGyms,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannaworkout'
  });

  // Fetch playground data for WannaPlay
  const { data: playgrounds = [], isLoading: playgroundsLoading, error: playgroundsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/playgrounds/bounds', currentBounds] : ['/api/amenities/playgrounds'],
    queryFn: currentBounds 
      ? () => fetchPlaygroundsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchPlaygrounds,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannaplay'
  });

  // Fetch prayer room data for WannaPray
  const { data: mosques = [], isLoading: mosquesLoading, error: mosquesError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/mosques/bounds', currentBounds] : ['/api/amenities/mosques'],
    queryFn: currentBounds 
      ? () => fetchMosquesForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchMosques,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannapray'
  });

  const { data: churches = [], isLoading: churchesLoading, error: churchesError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/churches/bounds', currentBounds] : ['/api/amenities/churches'],
    queryFn: currentBounds 
      ? () => fetchChurchesForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchChurches,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannapray'
  });

  const { data: prayerRooms = [], isLoading: prayerRoomsLoading, error: prayerRoomsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/prayer-rooms/bounds', currentBounds] : ['/api/amenities/prayer-rooms'],
    queryFn: currentBounds 
      ? () => fetchPrayerRoomsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchPrayerRooms,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannapray'
  });

  // Fetch waxing salon data for WannaWax
  const { data: waxingSalons = [], isLoading: waxingSalonsLoading, error: waxingSalonsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/waxing-salons/bounds', currentBounds] : ['/api/amenities/waxing-salons'],
    queryFn: currentBounds 
      ? () => fetchWaxingSalonsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchWaxingSalons,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannawax'
  });

  // Fetch nail salon data for WannaManiPedi
  const { data: nailSalons = [], isLoading: nailSalonsLoading, error: nailSalonsError } = useQuery({
    queryKey: currentBounds ? ['/api/amenities/nail-salons/bounds', currentBounds] : ['/api/amenities/nail-salons'],
    queryFn: currentBounds 
      ? () => fetchNailSalonsForBounds(currentBounds.swLat, currentBounds.swLng, currentBounds.neLat, currentBounds.neLng)
      : fetchNailSalons,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: appType === 'wannamanipedi'
  });

  // Debug prayer room data
  useEffect(() => {
    if (appType === 'wannapray') {
      console.log('🕌 Prayer room data:', { mosques: mosques.length, churches: churches.length, prayerRooms: prayerRooms.length });
      console.log('🔍 Current bounds:', currentBounds);
      console.log('📍 Filters:', filters);
    }
  }, [appType, mosques, churches, prayerRooms, currentBounds, filters]);

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
  const isLoading = bathroomsLoading || dogParksLoading || showersLoading || 
    (appType === 'wannaworkout' && (fitnessStationsLoading || outdoorGymsLoading || swimmingPoolsLoading || gymsLoading)) ||
    (appType === 'wannaplay' && playgroundsLoading) ||
    (appType === 'wannapray' && (mosquesLoading || churchesLoading || prayerRoomsLoading)) ||
    (appType === 'wannawax' && waxingSalonsLoading) ||
    (appType === 'wannamanipedi' && nailSalonsLoading);

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

      // Fitness facilities for WannaWorkOut
      if (appType === 'wannaworkout') {
        if (filters.showFitnessStations && fitnessStations.length > 0) {
          fitnessStations.forEach((amenity: MapAmenity) => {
            const marker = createFitnessStationMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showOutdoorGyms && outdoorGyms.length > 0) {
          outdoorGyms.forEach((amenity: MapAmenity) => {
            const marker = createOutdoorGymMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showSwimmingPools && swimmingPools.length > 0) {
          swimmingPools.forEach((amenity: MapAmenity) => {
            const marker = createSwimmingPoolMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showGyms && gyms.length > 0) {
          gyms.forEach((amenity: MapAmenity) => {
            const marker = createGymMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }
      }

      // Playground facilities for WannaPlay
      if (appType === 'wannaplay') {
        if (filters.showPlaygrounds && playgrounds.length > 0) {
          playgrounds.forEach((amenity: MapAmenity) => {
            const marker = createPlaygroundMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showAccessible && playgrounds.length > 0) {
          playgrounds.forEach((amenity: MapAmenity) => {
            if (amenity.wheelchair === true) {
              const marker = createAccessiblePlaygroundMarker(amenity, userLocation);
              markersRef.current.addLayer(marker);
            }
          });
        }

        if (filters.showWaterPlay && playgrounds.length > 0) {
          playgrounds.forEach((amenity: MapAmenity) => {
            if (amenity.waterPlay === true) {
              const marker = createWaterPlayMarker(amenity, userLocation);
              markersRef.current.addLayer(marker);
            }
          });
        }

        if (filters.showBabyChange && playgrounds.length > 0) {
          playgrounds.forEach((amenity: MapAmenity) => {
            if (amenity.babyChange === true) {
              const marker = createBabyChangePlaygroundMarker(amenity, userLocation);
              markersRef.current.addLayer(marker);
            }
          });
        }
      }

      // Prayer room facilities for WannaPray
      if (appType === 'wannapray') {
        if (filters.showMosques && mosques.length > 0) {
          mosques.forEach((amenity: MapAmenity) => {
            const marker = createMosqueMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showChurches && churches.length > 0) {
          churches.forEach((amenity: MapAmenity) => {
            const marker = createChurchMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }

        if (filters.showPrayerRooms && prayerRooms.length > 0) {
          prayerRooms.forEach((amenity: MapAmenity) => {
            const marker = createPrayerRoomMarker(amenity, userLocation);
            markersRef.current.addLayer(marker);
          });
        }
      }
    }
  }, [language, bathrooms, dogParks, showers, fitnessStations, outdoorGyms, swimmingPools, gyms, playgrounds, mosques, churches, prayerRooms, filters, userLocation, isLoading, appType]);

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

  // Fitness facility error handling
  useEffect(() => {
    if (fitnessStationsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Fitness Stations", 
        description: "Failed to load fitness station data. Please check your internet connection.",
      });
    }
  }, [fitnessStationsError, toast]);

  useEffect(() => {
    if (outdoorGymsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Outdoor Gyms", 
        description: "Failed to load outdoor gym data. Please check your internet connection.",
      });
    }
  }, [outdoorGymsError, toast]);

  useEffect(() => {
    if (swimmingPoolsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Swimming Pools", 
        description: "Failed to load swimming pool data. Please check your internet connection.",
      });
    }
  }, [swimmingPoolsError, toast]);

  useEffect(() => {
    if (gymsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Gyms", 
        description: "Failed to load gym data. Please check your internet connection.",
      });
    }
  }, [gymsError, toast]);

  // Playground error handling
  useEffect(() => {
    if (playgroundsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Playgrounds", 
        description: "Failed to load playground data. Please check your internet connection.",
      });
    }
  }, [playgroundsError, toast]);

  // Prayer room error handling for WannaPray
  useEffect(() => {
    if (mosquesError) {
      toast({
        variant: "destructive",
        title: "Error Loading Mosques", 
        description: "Failed to load mosque data. Please check your internet connection.",
      });
    }
  }, [mosquesError, toast]);

  useEffect(() => {
    if (churchesError) {
      toast({
        variant: "destructive",
        title: "Error Loading Churches", 
        description: "Failed to load church data. Please check your internet connection.",
      });
    }
  }, [churchesError, toast]);

  useEffect(() => {
    if (prayerRoomsError) {
      toast({
        variant: "destructive",
        title: "Error Loading Prayer Rooms", 
        description: "Failed to load prayer room data. Please check your internet connection.",
      });
    }
  }, [prayerRoomsError, toast]);

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

    // Add fitness equipment markers for WannaWorkOut
    if (appType === 'wannaworkout') {
      if (filters.showFitnessStations && fitnessStations.length > 0) {
        fitnessStations.forEach((amenity: MapAmenity) => {
          const marker = createFitnessStationMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showOutdoorGyms && outdoorGyms.length > 0) {
        outdoorGyms.forEach((amenity: MapAmenity) => {
          const marker = createOutdoorGymMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showSwimmingPools && swimmingPools.length > 0) {
        swimmingPools.forEach((amenity: MapAmenity) => {
          const marker = createSwimmingPoolMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showGyms && gyms.length > 0) {
        gyms.forEach((amenity: MapAmenity) => {
          const marker = createGymMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }
    }

    // Add playground markers for WannaPlay
    if (appType === 'wannaplay') {
      if (filters.showPlaygrounds && playgrounds.length > 0) {
        playgrounds.forEach((amenity: MapAmenity) => {
          const marker = createPlaygroundMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showAccessible && playgrounds.length > 0) {
        playgrounds.forEach((amenity: MapAmenity) => {
          if (amenity.wheelchair === true) {
            const marker = createAccessiblePlaygroundMarker(amenity, userLocation);
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

      if (filters.showWaterPlay && playgrounds.length > 0) {
        playgrounds.forEach((amenity: MapAmenity) => {
          if (amenity.waterPlay === true) {
            const marker = createWaterPlayMarker(amenity, userLocation);
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

      if (filters.showBabyChange && playgrounds.length > 0) {
        playgrounds.forEach((amenity: MapAmenity) => {
          if (amenity.babyChange === true) {
            const marker = createBabyChangePlaygroundMarker(amenity, userLocation);
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
    }

    // Add waxing salon markers for WannaWax
    if (appType === 'wannawax') {
      if (filters.showWaxingSalons && waxingSalons.length > 0) {
        waxingSalons.forEach((amenity: MapAmenity) => {
          const marker = createWaxingSalonMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }
    }

    // Add nail salon markers for WannaManiPedi
    if (appType === 'wannamanipedi') {
      if (filters.showNailSalons && nailSalons.length > 0) {
        nailSalons.forEach((amenity: MapAmenity) => {
          const marker = createNailSalonMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }
    }

    // Add prayer room markers for WannaPray
    if (appType === 'wannapray') {
      if (filters.showMosques && mosques.length > 0) {
        mosques.forEach((amenity: MapAmenity) => {
          const marker = createMosqueMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showChurches && churches.length > 0) {
        churches.forEach((amenity: MapAmenity) => {
          const marker = createChurchMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }

      if (filters.showPrayerRooms && prayerRooms.length > 0) {
        prayerRooms.forEach((amenity: MapAmenity) => {
          const marker = createPrayerRoomMarker(amenity, userLocation);
          marker.on('click', () => {
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, amenity.latitude, amenity.longitude)
              : undefined;
            onMarkerClick({ amenity, distance });
          });
          markersRef.current.addLayer(marker);
        });
      }
    }
  }, [filters, bathrooms, dogParks, showers, fitnessStations, outdoorGyms, swimmingPools, gyms, playgrounds, mosques, churches, prayerRooms, waxingSalons, nailSalons, userLocation, onMarkerClick, appType]);

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

  // Fitness facility marker creation functions
  const createFitnessStationMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #2563eb; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createFitnessPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createOutdoorGymMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #16a34a; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M7.4 10l-1.4 1.4 5.6 5.6 1.4-1.4L7.4 10zm8.2 0l1.4 1.4-5.6 5.6-1.4-1.4L15.6 10zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createFitnessPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createSwimmingPoolMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #0891b2; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M2 12c0 1.1.89 2 2 2s2-.9 2-2-.89-2-2-2-2 .9-2 2zm6 0c0 1.1.89 2 2 2s2-.9 2-2-.89-2-2-2-2 .9-2 2zm6 0c0 1.1.89 2 2 2s2-.9 2-2-.89-2-2-2-2 .9-2 2zm6 0c0 1.1.89 2 2 2s2-.9 2-2-.89-2-2-2-2 .9-2 2z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createFitnessPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createGymMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #9333ea; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M7 13h2v4h6v-4h2v6H7v-6zm6-7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm2.5 0l-1.09 2.41L16 9l-1.41-.59L13.5 6 12.09 8.41 10.5 9l1.59.59L13.18 12H10.82l1.09-2.41L10.5 9l1.41-.59L13 6l1.09 2.41L15.5 9 14.41 8.41 13.5 6z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createFitnessPopup(amenity, userLoc);
    
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

  const createFitnessPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges based on amenity type
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }
    if (amenity.covered === true) {
      features.push(`<span style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">🏠 Covered</span>`);
    }

    // Determine title color based on type
    let titleColor = '#2563eb'; // Default blue
    if (amenity.type === 'outdoor_gym') titleColor = '#16a34a';
    else if (amenity.type === 'swimming_pool') titleColor = '#0891b2';
    else if (amenity.type === 'gym') titleColor = '#9333ea';

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: ${titleColor};">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Type:</strong> ${
            amenity.type === 'fitness_station' ? 'Fitness Equipment' :
            amenity.type === 'outdoor_gym' ? 'Outdoor Gym' :
            amenity.type === 'swimming_pool' ? 'Swimming Pool' :
            amenity.type === 'gym' ? 'Indoor Gym' : 'Fitness Facility'
          }</p>
          <p style="margin: 4px 0;"><strong>${labels.fee}:</strong> ${amenity.fee === true ? labels.required : amenity.fee === false ? labels.free : labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.accessible : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
          ${amenity.operator ? `<p style="margin: 4px 0;"><strong>Operator:</strong> ${amenity.operator}</p>` : ''}
        </div>
      </div>
    `;
  };

  // Playground popup for WannaPlay
  const createPlaygroundPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.waterPlay === true) {
      features.push(`<span style="background-color: #06b6d4; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💦 Water Play</span>`);
    }
    if (amenity.babyChange === true) {
      features.push(`<span style="background-color: #9333ea; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">👶 ${labels.babyChange}</span>`);
    }
    if (amenity.fenced === true) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">🔒 ${labels.fenced}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #f59e0b;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Equipment:</strong> ${amenity.equipment || labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>Age Group:</strong> ${amenity.ageGroup || 'All ages'}</p>
          <p style="margin: 4px 0;"><strong>Surface:</strong> ${amenity.surfacing || labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.accessible : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
        </div>
      </div>
    `;
  };

  // Playground marker functions for WannaPlay
  const createPlaygroundMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #f59e0b; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPlaygroundPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createAccessiblePlaygroundMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
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

    const popupContent = createPlaygroundPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createWaterPlayMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #06b6d4; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPlaygroundPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createBabyChangePlaygroundMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #9333ea; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A1,1 0 0,1 14.5,8V9.5H13.5V15A0.5,0.5 0 0,1 13,15.5H11A0.5,0.5 0 0,1 10.5,15V9.5H9.5V8A1,1 0 0,1 10.5,7Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPlaygroundPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  // Prayer room marker creation functions for WannaPray
  const createMosqueMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #059669; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2.5L8.5,9H15.5L12,2.5M12,4.5L13.5,7.5H10.5L12,4.5M18,10V21H6V10C6,8.89 6.89,8 8,8H16C17.11,8 18,8.89 18,10M16,19V12H8V19H16Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPrayerRoomPopup(amenity, userLoc, 'mosque');
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createChurchMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #7c3aed; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M10,2V8H6V10H10V12H8V22H16V12H14V10H18V8H14V2H10M12,4H12V8H12V4Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPrayerRoomPopup(amenity, userLoc, 'church');
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  const createPrayerRoomMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #dc2626; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,3.18L19,6.3V11.22C19,15.54 16.19,19.78 12,20.95C7.81,19.78 5,15.54 5,11.22V6.3L12,3.18Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createPrayerRoomPopup(amenity, userLoc, 'prayer_room');
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  // Prayer room popup creation
  const createPrayerRoomPopup = (amenity: MapAmenity, userLoc: UserLocation | null, type: string) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    // Determine title color based on type
    let titleColor = '#dc2626'; // Default red for prayer rooms
    if (type === 'mosque') titleColor = '#059669';
    else if (type === 'church') titleColor = '#7c3aed';

    const typeDisplay = type === 'mosque' ? 'Mosque' : 
                       type === 'church' ? 'Church' : 
                       'Prayer Room';

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: ${titleColor};">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Type:</strong> ${typeDisplay}</p>
          <p style="margin: 4px 0;"><strong>Religion:</strong> ${amenity.religion || labels.unknown}</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.accessible : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
          ${amenity.denomination ? `<p style="margin: 4px 0;"><strong>Denomination:</strong> ${amenity.denomination}</p>` : ''}
          ${amenity.operator ? `<p style="margin: 4px 0;"><strong>Operator:</strong> ${amenity.operator}</p>` : ''}
        </div>
      </div>
    `;
  };

  // Waxing salon marker creation functions for WannaWax
  const createWaxingSalonMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #e91e63; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createWaxingSalonPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  // Nail salon marker creation functions for WannaManiPedi
  const createNailSalonMarker = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #f59e0b; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
               <svg style="width: 12px; height: 12px; color: white;" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupContent = createNailSalonPopup(amenity, userLoc);
    
    return L.marker([amenity.latitude, amenity.longitude], { icon })
      .bindPopup(popupContent);
  };

  // Waxing salon popup creation
  const createWaxingSalonPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #e91e63;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Type:</strong> Waxing Salon</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.accessible : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
          ${amenity.operator ? `<p style="margin: 4px 0;"><strong>Operator:</strong> ${amenity.operator}</p>` : ''}
          ${amenity.phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${amenity.phone}</p>` : ''}
          ${amenity.website ? `<p style="margin: 4px 0;"><strong>Website:</strong> <a href="${amenity.website}" target="_blank" style="color: #e91e63;">${amenity.website}</a></p>` : ''}
        </div>
      </div>
    `;
  };

  // Nail salon popup creation
  const createNailSalonPopup = (amenity: MapAmenity, userLoc: UserLocation | null) => {
    const labels = getPopupLabels(language);
    const distance = userLoc 
      ? calculateDistance(userLoc.lat, userLoc.lng, amenity.latitude, amenity.longitude)
      : null;

    // Create feature badges
    const features = [];
    if (amenity.wheelchair === true) {
      features.push(`<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">♿ ${labels.accessible}</span>`);
    }
    if (amenity.fee === false) {
      features.push(`<span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">💰 ${labels.free}</span>`);
    }

    return `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #f59e0b;">${amenity.name}</h3>
        ${distance ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${distance.toFixed(1)} ${labels.kmAway}</p>` : ''}
        
        ${features.length > 0 ? `<div style="margin: 8px 0;">${features.join('')}</div>` : ''}
        
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Type:</strong> Nail Salon</p>
          <p style="margin: 4px 0;"><strong>${labels.accessibility}:</strong> ${amenity.wheelchair === true ? labels.accessible : labels.checkOnSite}</p>
          <p style="margin: 4px 0;"><strong>${labels.hours}:</strong> ${amenity.openingHours || labels.unknown}</p>
          ${amenity.operator ? `<p style="margin: 4px 0;"><strong>Operator:</strong> ${amenity.operator}</p>` : ''}
          ${amenity.phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${amenity.phone}</p>` : ''}
          ${amenity.website ? `<p style="margin: 4px 0;"><strong>Website:</strong> <a href="${amenity.website}" target="_blank" style="color: #f59e0b;">${amenity.website}</a></p>` : ''}
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
