'use client';

import React, { useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

const MapPanel = React.memo(function MapPanel({
  onUpdate,
  isJourneyActive = false
}: {
  onUpdate?: (payload: {
    userPos: LatLng | null;
    target: LatLng | null;
    distanceKm: number | null;
    duration: string | null;
    speed?: number;
    heading?: number;
  }) => void,
  isJourneyActive?: boolean
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [scriptError, setScriptError] = useState<string | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const directionsServiceRef = useRef<any | null>(null);
  const directionsRendererRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);

  // Ref to track if we have performed the initial center on user
  const initialCenterRef = useRef(false);

  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [target, setTarget] = useState<LatLng | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);
  const watcherRef = useRef<number | null>(null);

  // load Google Maps JS if needed
  useEffect(() => {
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set');
      setScriptError('Missing Google Maps API key. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart the dev server.');
      return;
    }
    if ((window as any).google && (window as any).google.maps) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector(`script[data-google-maps]`);
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-google-maps', '1');
    s.addEventListener('load', () => setScriptLoaded(true));
    s.addEventListener('error', () => {
      console.error('Google Maps script failed to load');
      setScriptError('Failed to load Google Maps script. Check your API key and network.');
    });
    document.head.appendChild(s);
    return () => {
      // do not remove script (might be used elsewhere)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // init map when script available
  useEffect(() => {
    if (!scriptLoaded || scriptError) return;
    if (!mapDivRef.current) return;
    const g = (window as any).google;

    // initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(mapDivRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 3,
        disableDefaultUI: false,
        zoomControl: true, // Specific controls
        gestureHandling: 'greedy', // Better mobile touch handling
      });

      // Init Directions
      directionsServiceRef.current = new g.maps.DirectionsService();
      directionsRendererRef.current = new g.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: false,
      });

      // click to set target
      mapRef.current.addListener('click', (e: any) => {
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setTarget(coords);
      });
    }

  }, [scriptLoaded, scriptError]);

  // Watch Geolocation (Speed + High Frequency)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const speed = pos.coords.speed; // m/s
        const heading = pos.coords.heading;

        setUserPos(coords);

        const g = (window as any).google;
        const marker = userMarkerRef.current;
        const map = mapRef.current;

        // --- OPTIMIZED MAP UPDATES ---
        if (g && map) {
          // 1. Create Marker if missing
          if (!marker) {
            userMarkerRef.current = new g.maps.Marker({
              position: coords,
              map: map,
              title: "Your Location",
              // Default icon initially
            });
          } else {
            // 2. Just update position (Cheap)
            marker.setPosition(coords);
          }

          const currentMarker = userMarkerRef.current;

          // 3. Update Icon (Only if Journey Mode toggles or heading changes significantly)
          // For now, simpler: Just set icon type based on mode.
          // Note: Creating a new object literals every frame can be expensive if complex, 
          // but for just { path, ... } it's okay-ish. 
          // To be safer, we could memoize, but let's just use the logic directly.

          if (isJourneyActive) {
            const arrowIcon = {
              path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeWeight: 2,
              rotation: heading || 0 // Use GPS heading
            };
            currentMarker.setIcon(arrowIcon);

            // 4. Smooth Pan (Only if "far" or force center?)
            // Instead of panTo every frame (which jerks/blinks), use panTo only if distance is large?
            // Or just let it be. But panTo is usually animated.
            // If we really want "Game-like" camera, we'd need to disable panTo animation or use requestAnimationFrame.
            // For standard Maps API, calling panTo repeatedly is okay but might fight user interaction.

            // Only auto-center if user hasn't dragged map away? 
            // For this task, let's enforce center but maybe NOT zoom strictness every frame.
            map.panTo(coords);

            // Don't fight Zoom unless necessary?
            // map.setZoom(18); // This prevents zooming out.
          } else {
            currentMarker.setIcon(null); // Reset to default red pin
          }
        }

        // Parent Callback
        if (onUpdate) {
          onUpdate({
            userPos: coords,
            target: null, // Don't wipe
            distanceKm: null, // Don't wipe
            duration: null,
            speed: speed ?? undefined,
            heading: heading ?? undefined
          });
        }
      },
      (err) => console.warn('Geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    watcherRef.current = id as unknown as number;
    return () => {
      if (watcherRef.current != null) navigator.geolocation.clearWatch(watcherRef.current as number);
    };
  }, [onUpdate, isJourneyActive]);
  // Added isJourneyActive to dependency so we switch icons immediately on mode change
  // Note: onUpdate is memoized by parent, so this effect resets only when mode changes.

  // Handle Routing Logic separately
  useEffect(() => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !userPos || !target) return;
    const g = (window as any).google;

    directionsServiceRef.current.route(
      {
        origin: userPos,
        destination: target,
        travelMode: g.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === g.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
          if (onUpdate) {
            // We don't pass userPos/target here to avoid clobbering? 
            // Wait, onUpdate expects everything.
            onUpdate({
              userPos,
              target,
              distanceKm: parseFloat((leg.distance.value / 1000).toFixed(1)),
              duration: leg.duration.text
            });
          }
        }
      }
    );
  }, [target]); // Only re-route when target changes (or userPos changes significantly? ignored for now to save API calls)

  // One-time initial center
  useEffect(() => {
    if (userPos && !initialCenterRef.current && mapRef.current) {
      mapRef.current.panTo(userPos);
      mapRef.current.setZoom(15);
      initialCenterRef.current = true;
    }
  }, [userPos]);

  // View Helpers
  const handleCenterOnUser = () => {
    if (!mapRef.current || !userPos) return;
    mapRef.current.panTo(userPos);
    mapRef.current.setZoom(isJourneyActive ? 18 : 15);
  };

  if (scriptError) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="text-rose-600 font-semibold">{scriptError}</div>
        <div className="text-sm text-slate-600 mt-2">See README.md for setup instructions.</div>
      </div>
    );
  }

  // Visual Layout
  return (
    <div className={`transition-all duration-300 ${isJourneyActive ? 'fixed inset-0 z-0 h-screen w-screen' : 'max-w-5xl mx-auto bg-white rounded-2xl shadow p-6'}`}>

      {!scriptLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-4 rounded shadow">
          Loading map...
        </div>
      )}

      {/* Default Header - Hidden in Journey Mode */}
      {!isJourneyActive && (
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Trip Route Planner</h3>
            <p className="text-sm text-slate-600">
              {routeInfo ? `Driving Distance: ${routeInfo.distance} • Time: ${routeInfo.duration}` : "Click map to set destination"}
            </p>
          </div>
          <div className="space-x-2">
            <button onClick={handleCenterOnUser} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center shadow hover:bg-blue-700 transition">
              Me
              <svg className="w-4 h-4 ml-2" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.00001 3C8.82844 3 9.50001 2.32843 9.50001 1.5C9.50001 0.671573 8.82844 0 8.00001 0C7.17158 0 6.50001 0.671573 6.50001 1.5C6.50001 2.32843 7.17158 3 8.00001 3Z" fill="#ffffff"></path>
                <path d="M12 4V2H14V4C14 5.10457 13.1045 6 12 6H10.5454L10.9897 16H8.98773L8.76557 11H7.23421L7.01193 16H5.00995L5.42014 6.77308L3.29995 9.6L1.69995 8.4L4.99995 4H12Z" fill="#ffffff"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`relative w-full overflow-hidden ${isJourneyActive ? 'h-full w-full' : 'h-96 rounded-xl border border-slate-200'}`}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating "Center Me" button for Journey Mode */}
        {isJourneyActive && (
          <button
            onClick={handleCenterOnUser}
            className="absolute right-4 bottom-32 bg-white p-3 rounded-full shadow-xl z-10 text-blue-600 hover:bg-slate-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14A6 6 0 118 2a6 6 0 010 12zM8 4a4 4 0 100 8A4 4 0 008 4z" />
            </svg>
          </button>
        )}
      </div>

      {!isJourneyActive && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border rounded bg-slate-50">
            <div className="text-xs text-gray-800 font-semibold">From</div>
            <div className="font-medium text-sm truncate text-gray-800">{userPos ? `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : 'Locating...'}</div>
          </div>
          <div className="p-3 border rounded bg-slate-50">
            <div className="text-xs text-gray-800 font-semibold">To</div>
            <div className="font-medium text-sm truncate text-gray-800">{target ? `${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}` : 'Select on map'}</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MapPanel;
