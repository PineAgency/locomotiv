'use client';

import React, { useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

export default function MapPanel({
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

    // initialize map
    mapRef.current = new g.maps.Map(mapDivRef.current, {
      center: { lat: 0, lng: 0 },
      zoom: 3,
      disableDefaultUI: false, // We might want to disable this for Journey Mode later
    });

    // Init Directions
    directionsServiceRef.current = new g.maps.DirectionsService();
    directionsRendererRef.current = new g.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: false,
    });

    // click to set target
    mapRef.current.addListener('click', (e: any) => {
      // Prevent setting target if Journey is active? Or allow re-routing?
      // Let's allow re-routing for now.
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setTarget(coords);
    });

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

        // Immediate update for Journey Mode / Speedometer
        if (onUpdate) {
          onUpdate({
            userPos: coords,
            target: null, // Don't wipe
            distanceKm: null, // Don't wipe
            duration: null,
            speed: speed,
            heading: heading
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
  }, [onUpdate]);

  // Handle Visuals & Routing
  useEffect(() => {
    if (!scriptLoaded || !directionsServiceRef.current || !directionsRendererRef.current || !mapRef.current) return;
    const g = (window as any).google;

    // 1. Handle User Position Marker & Pan Logic
    if (userPos) {
      // Create/Update marker
      if (!userMarkerRef.current) {
        userMarkerRef.current = new g.maps.Marker({
          position: userPos,
          map: mapRef.current,
          title: "Your Location",
          // Custom Icon for Journey Mode?
          icon: isJourneyActive ? {
            path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            rotation: 0 // Ideally rotate based on heading
          } : undefined
        });
      } else {
        userMarkerRef.current.setPosition(userPos);
        userMarkerRef.current.setMap(mapRef.current);

        // Update Icon state if changed
        if (isJourneyActive) {
          userMarkerRef.current.setIcon({
            path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            rotation: 0
          });
        } else {
          userMarkerRef.current.setIcon(null); // Default marker
        }
      }

      // AUTO-CENTER LOGIC FIX:
      // Only center if:
      // 1. First time locating user (!initialCenterRef.current)
      // 2. OR Journey Mode is active (Follow user)
      if (!initialCenterRef.current) {
        mapRef.current.panTo(userPos);
        mapRef.current.setZoom(15);
        initialCenterRef.current = true;
      } else if (isJourneyActive) {
        mapRef.current.panTo(userPos);
        mapRef.current.setZoom(18); // Navigation Zoom
      }
    }

    // 2. Handle Routing
    if (userPos && target) {
      directionsServiceRef.current.route(
        {
          origin: userPos,
          destination: target,
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === g.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);
            // Hide individual user marker if renderer shows it?
            // Keeping both for now ensures "Live" position is always visible even if route is static.

            const leg = result.routes[0].legs[0];
            const distText = leg.distance.text;
            const distVal = leg.distance.value;
            const durText = leg.duration.text;
            const distKm = parseFloat((distVal / 1000).toFixed(1));

            setRouteInfo({ distance: distText, duration: durText });
            if (onUpdate) onUpdate({ userPos, target, distanceKm: distKm, duration: durText });
          } else {
            console.error('Directions request failed ' + status);
          }
        }
      );
    } else if (userPos && !target) {
      directionsRendererRef.current.setDirections({ routes: [] });
      setRouteInfo(null);
    }
  }, [scriptLoaded, userPos, target, onUpdate, isJourneyActive]);

  const handleCenterOnUser = () => {
    if (!mapRef.current || !userPos) return;
    mapRef.current.panTo(userPos);
    mapRef.current.setZoom(isJourneyActive ? 18 : 15);
    initialCenterRef.current = true; // Effectively we just centered
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
}
