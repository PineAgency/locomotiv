'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Car, Calendar, Tag, Shield, Zap, Award, TrendingUp, CheckCircle,
  ArrowRight, X, MapPin, Fuel, AlertCircle, Droplets, Ruler, Navigation // Added Navigation icon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Features from './components/Features';
import MapPanel from './components/MapPanel';
import JourneyModal from './components/JourneyModal'; // New Import

export default function CarLandingPage() {
  const [selection, setSelection] = useState({ year: '2026', make: '', model: '' });
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState({ makes: false, models: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [vehicleSpecs, setVehicleSpecs] = useState<any[]>([]);
  const [specsError, setSpecsError] = useState('');

  // MVP STATES
  const [trip, setTrip] = useState({
    origin: '',
    destination: '',
    destinationAddress: '', // Added Address
    distanceKm: 0,
    duration: '',
  });
  const [fuelData, setFuelData] = useState({
    tankCapacity: 50,  // liters (common Toyota/Honda)
    consumption: 12,   // km/L (realistic diesel/petrol highway)
    currentFuel: 50,   // % full
    fuelType: 'Petrol/Diesel',
    pricePerLiter: 1100, // Naira
  });
  const [tripAnalysis, setTripAnalysis] = useState<any>(null);

  // JOURNEY MODE STATE
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [journeyStats, setJourneyStats] = useState({
    speed: 0,
    distanceRemaining: 0,
    durationRemaining: '',
  });

  // ... (useEffects for makes/models)
  useEffect(() => {
    const fetchMakes = async () => {
      setLoading(prev => ({ ...prev, makes: true }));
      try {
        const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json');
        const data = await res.json();
        setMakes(data.Results.sort((a: any, b: any) => a.MakeName.localeCompare(b.MakeName)));
      } catch (err) {
        console.error('Failed to load makes');
      } finally {
        setLoading(prev => ({ ...prev, makes: false }));
      }
    };
    fetchMakes();
  }, []);

  useEffect(() => {
    if (selection.make && selection.year) {
      setLoading(prev => ({ ...prev, models: true }));
      const fetchModels = async () => {
        try {
          const res = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(selection.make)}/modelyear/${selection.year}?format=json`
          );
          const data = await res.json();
          const uniqueModels = Array.from(new Map((data.Results || []).map((m: any) => [m.Model_ID, m])).values());
          uniqueModels.sort((a: any, b: any) => a.Model_Name.localeCompare(b.Model_Name));
          setModels(uniqueModels);
        } catch (err) {
          console.error('Failed to load models');
        } finally {
          setLoading(prev => ({ ...prev, models: false }));
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [selection.make, selection.year]);

  // Calculate trip suitability when fuel data changes
  useEffect(() => {
    if (vehicleSpecs.length > 0 && fuelData.tankCapacity > 0 && fuelData.consumption > 0) {
      calculateTripSuitability();
    }
  }, [fuelData, trip.distanceKm, vehicleSpecs]);

  // MVP CORE: Trip Suitability Calculator
  const calculateTripSuitability = () => {
    const fullRangeKm = fuelData.tankCapacity * fuelData.consumption;
    const currentRangeKm = fullRangeKm * (fuelData.currentFuel / 100);
    const fuelNeededLiters = trip.distanceKm / fuelData.consumption;
    const fullTanksNeeded = Math.ceil(fuelNeededLiters / fuelData.tankCapacity);
    const stopsNeeded = Math.max(0, fullTanksNeeded - 1);
    const safetyBuffer = 0.85; // Never go below 15% fuel
    const safeRangeKm = fullRangeKm * safetyBuffer;

    const isSuitable = trip.distanceKm <= safeRangeKm || stopsNeeded <= 3;

    const analysis = {
      fullRangeKm: Math.round(fullRangeKm),
      currentRangeKm: Math.round(currentRangeKm),
      fuelNeededLiters: Math.round(fuelNeededLiters * 10) / 10,
      stopsNeeded,
      fullTanksNeeded,
      fuelCost: Math.round(fuelNeededLiters * fuelData.pricePerLiter),
      isSuitable,
      suitabilityScore: Math.min(100, Math.round(
        (safeRangeKm / trip.distanceKm) * 100 * (stopsNeeded <= 2 ? 1.3 : 1)
      )),
      fuelType: vehicleSpecs[0]?.model_engine_fuel || 'Petrol/Diesel',
    };

    setTripAnalysis(analysis);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setSelection(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'year' && { make: '', model: '' }),
      ...(name === 'make' && { model: '' })
    }));
  };

  const handleSearch = async () => {
    if (selection.make && selection.model) {
      setSidebarOpen(true);
      setDetailsLoading(true);
      setVehicleDetails([]);
      setSpecsError('');
      try {
        const typesPromise = fetch(
          `/api/nhtsa?make=${encodeURIComponent(selection.make)}&model=${encodeURIComponent(selection.model)}&year=${encodeURIComponent(selection.year)}`
        ).then(async r => {
          let parsed = null;
          try { parsed = await r.json(); } catch (err) { parsed = null; }
          return { ok: r.ok, parsed };
        }).catch(err => ({ ok: false, error: String(err) }));

        setSpecsLoading(true);
        const carQueryUrl = `/api/carquery?make=${encodeURIComponent(selection.make)}&model=${encodeURIComponent(
          selection.model
        )}&year=${encodeURIComponent(selection.year)}`;
        const specsPromise = fetch(carQueryUrl)
          .then(async r => {
            if (!r.ok) return null;
            const json = await r.json();
            return json && json.data ? json.data : null;
          })
          .catch(() => null);

        const [typesRes, specsData] = await Promise.all([typesPromise, specsPromise]);
        let types: any[] = [];
        const tr: any = typesRes;
        if (tr && tr.ok && tr.parsed && tr.parsed.data) {
          types = tr.parsed.data.Results || [];
          setVehicleDetails(types);
        } else {
          setVehicleDetails([]);
          console.warn('NHTSA fetch failed:', typesRes);
        }

        if (specsData && specsData.Trims && Array.isArray(specsData.Trims) && specsData.Trims.length > 0) {
          setVehicleSpecs(specsData.Trims);
          // Auto-detect fuel type from first trim
          const firstTrim = specsData.Trims[0];
          if (firstTrim) {
            const rawGal = parseFloat(firstTrim.model_fuel_cap_l || '0');
            const rawMpg = parseFloat(firstTrim.model_lkm_hwy || firstTrim.model_lkm_mixed || '0');

            // API uses Imperial units labeled as metric keys (Gallons as _l, MPG as _lkm)
            // Conversion: 1 US Gallon = 3.78541 Liters
            // Conversion: 1 MPG = 0.425144 km/L
            const liters = rawGal * 3.78541;
            const kmpl = rawMpg * 0.425144;

            let estimatedPrice = 1100;
            const fType = (firstTrim.model_engine_fuel || '').toLowerCase();
            if (fType.includes('diesel')) estimatedPrice = 1300;

            setFuelData(prev => ({
              ...prev,
              fuelType: firstTrim.model_engine_fuel || 'Petrol/Diesel',
              tankCapacity: liters > 5 ? parseFloat(liters.toFixed(1)) : 50, // Only update if valid (>5L)
              consumption: kmpl > 3 ? parseFloat(kmpl.toFixed(1)) : 12,      // Only update if valid (>3km/L)
              pricePerLiter: estimatedPrice
            }));
          }
        } else {
          setVehicleSpecs([]);
          setSpecsError('No trims/specs returned from CarQuery for this selection.');
          console.warn('CarQuery specs response:', specsData);
        }
      } catch (err) {
        console.error('Failed to load vehicle details or specs', err);
        setVehicleDetails([]);
        setVehicleSpecs([]);
        setSpecsError('Failed to load vehicle specs');
      } finally {
        setDetailsLoading(false);
        setSpecsLoading(false);
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // 🚀 SUITABILITY BADGE
  const SuitabilityBadge = ({ analysis }: { analysis: any }) => (
    <div className={`px-4 py-2 rounded-full font-bold text-xs flex items-center space-x-2 ${analysis?.isSuitable
      ? 'bg-green-100 text-green-800 border-2 border-green-200'
      : 'bg-orange-100 text-orange-800 border-2 border-orange-200'
      }`}>
      {analysis?.isSuitable ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>OK For {trip.distanceKm}km Trip</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Needs {analysis?.stopsNeeded} fuel stops</span>
        </>
      )}
    </div>
  );

  /* Fix: Memoize onUpdate to prevent infinite render loop in MapPanel */
  /* ENHANCED: Now receives speed and heading updates too */
  const handleMapUpdate = useCallback(({ userPos, target, distanceKm, duration, speed, address }:
    { userPos?: any, target?: any, distanceKm?: number | null, duration?: string | null, speed?: number, address?: string }) => {

    setTrip(prev => ({
      ...prev,
      origin: userPos ? `${userPos.lat.toFixed(5)}, ${userPos.lng.toFixed(5)}` : (prev.origin || ''),
      destination: target ? `${target.lat.toFixed(5)}, ${target.lng.toFixed(5)}` : (prev.destination || ''),
      destinationAddress: address || prev.destinationAddress, // Update Address
      distanceKm: distanceKm ?? prev.distanceKm,
      duration: duration || prev.duration,
    }));

    // Update Live Journey Stats if active
    if (speed !== undefined || (distanceKm !== null && distanceKm !== undefined)) {
      setJourneyStats(prev => ({
        speed: speed !== undefined ? speed : prev.speed,
        distanceRemaining: distanceKm ?? prev.distanceRemaining,
        durationRemaining: duration ?? prev.durationRemaining
      }));
    }

  }, []);

  const handleStartJourney = () => {
    setIsJourneyActive(true);
    // Ideally lock the screen wake lock here on mobile
  };

  const handleStopJourney = () => {
    setIsJourneyActive(false);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section - Hide if Journey Active for immersive feel? Or keep it? */}
      {/* We'll keep it but maybe the modal covers it safely. */}
      {!isJourneyActive && (
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 shadow-2xl">
                <Car className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Vehicle Specs
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
                Access comprehensive vehicle specifications + <span className="text-yellow-300">trip planning</span> instantly.
              </p>
            </div>
            {/* Search Card  */}
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
                  <select name="year" value={selection.year} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Make</label>
                  <select name="make" value={selection.make} disabled={loading.makes} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium disabled:opacity-50">
                    <option value="">All Makes</option>
                    {makes.map(m => <option key={m.MakeId} value={m.MakeName}>{m.MakeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                  <select name="model" value={selection.model} disabled={!selection.make || loading.models} onChange={handleChange} className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium disabled:opacity-50">
                    <option value="">All Models</option>
                    {models.map(m => <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={handleSearch} disabled={!selection.make || !selection.model} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group">
                    <Search className="w-5 h-5" />
                    <span className="hidden md:inline">Search</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MVP: Trip Planner Preview (above sidebar) */}
      {(selection.make || selection.model) && (
        <section className={`bg-gradient-to-r from-emerald-50 to-blue-50 py-12 border-t-4 border-green-200 ${isJourneyActive ? 'p-0 !py-0 border-none' : ''}`}>
          <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${isJourneyActive ? '!max-w-none !px-0' : ''}`}>

            {!isJourneyActive && (
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  🚗 {selection.make} {selection.model} Trip Analysis
                </h2>
                <div className="text-xl text-slate-600 max-w-2xl mx-auto flex flex-col items-center gap-2">
                  {trip.origin && trip.destination ? (
                    <>
                      <span className="font-semibold text-slate-800">{trip.distanceKm}km {trip.duration ? `• ${trip.duration}` : ''}</span>
                      {trip.destinationAddress && <span className="text-sm bg-white/50 px-3 py-1 rounded-full border border-slate-200">{trip.destinationAddress}</span>}
                    </>
                  ) : (
                    <span>Select origin and destination on the map below to calculate fuel costs.</span>
                  )}
                </div>
              </div>
            )}

            {/* Suitability Summary Cards - Only show if active and NOT in journey mode (Journey mode has its own overlay) */}
            {tripAnalysis && trip.distanceKm > 0 && !isJourneyActive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl border-4 border-green-100">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 mx-auto">
                    <Ruler className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">{tripAnalysis.fullRangeKm}km</h3>
                  <p className="text-green-700 font-semibold text-center">Full Tank Range</p>
                  <div className="w-full bg-slate-200 rounded-full h-3 mt-4">
                    <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (tripAnalysis.fullRangeKm / trip.distanceKm) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <SuitabilityBadge analysis={tripAnalysis} />
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-black text-slate-900">{tripAnalysis.suitabilityScore}%</div>
                    <div className="text-slate-600">Match Score</div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border-4 border-orange-100">
                  <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 mx-auto">
                    <Fuel className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">₦{tripAnalysis.fuelCost.toLocaleString()}</h3>
                  <p className="text-orange-700 font-semibold text-center">Total Fuel Cost</p>
                  <p className="text-sm text-slate-600 mt-2 text-center">
                    {tripAnalysis.stopsNeeded} stops needed
                  </p>
                </div>
              </div>
            )}

            {/* START JOURNEY BUTTON (Only if we have a trip planned) */}
            {tripAnalysis && trip.distanceKm > 0 && !isJourneyActive && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handleStartJourney}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-4 px-12 rounded-full shadow-2xl transform transition hover:scale-105 flex items-center space-x-3"
                >
                  <Navigation className="w-8 h-8" />
                  <span>Start Live Journey</span>
                </button>
              </div>
            )}

            {/* Map Panel (Consolidated) */}
            <div className={`${isJourneyActive ? 'fixed inset-0 z-0' : 'bg-white rounded-3xl shadow-2xl p-1 mb-8'}`}>
              <MapPanel
                onUpdate={handleMapUpdate}
                isJourneyActive={isJourneyActive}
              />
            </div>

            {/* Live Journey Overlay */}
            {isJourneyActive && (
              <JourneyModal
                speed={journeyStats.speed}
                distanceRemaining={journeyStats.distanceRemaining}
                durationRemaining={journeyStats.durationRemaining}
                onStop={handleStopJourney}
              />
            )}

          </div>
        </section>
      )}

      {/* Sidebar (ENHANCED with fuel inputs + trip planner) */}
      <div aria-hidden={!sidebarOpen} className={`fixed inset-0 z-40 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black bg-opacity-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Specifications</h3>
                <p className="text-sm text-slate-800">{selection.year} {selection.make} {selection.model}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-6">
              {/* Existing Vehicle Types  */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Vehicle Types</h4>
                {detailsLoading ? (
                  <div className="text-sm text-slate-600">Loading types...</div>
                ) : vehicleDetails.length === 0 ? (
                  <div className="text-sm text-slate-800">Types unavailable</div>
                ) : (
                  <ul className="space-y-3 max-h-32 overflow-auto">
                    {vehicleDetails.map((t, idx) => (
                      <li key={idx} className="p-3 border rounded bg-blue-600 text-slate-100 text-xs">
                        <div className="font-medium">{t.VehicleTypeName || t.VehicleType || JSON.stringify(t)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CarQuery Specs (slightly condensed) */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Engine Specs</h4>
                {specsLoading ? (
                  <div>Loading specs...</div>
                ) : vehicleSpecs.length === 0 ? (
                  <div className="text-sm text-slate-800">{specsError || 'No specs available'}</div>
                ) : (
                  <div className="space-y-3 max-h-40 overflow-auto">
                    {vehicleSpecs.slice(0, 3).map((s, i) => (
                      <div key={i} className="p-3 border rounded bg-blue-600 text-slate-100 text-xs">
                        <div className="font-medium">{s.model_name || s.model_trim}</div>
                        <div>Fuel: <span className="font-semibold">{s.model_engine_fuel || '—'}</span></div>
                        <div>Engine: {s.model_engine_type || s.model_engine_cc || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fuel Efficiency Inputs */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-2xl border-2 border-blue-100">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <Fuel className="w-4 h-4 mr-2 text-blue-600" />
                  Fuel Data (for trip planning)
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Tank Capacity (liters)</label>
                    <input
                      type="number"
                      min="10" max="120" step="5"
                      value={fuelData.tankCapacity}
                      onChange={(e) => setFuelData({ ...fuelData, tankCapacity: +e.target.value })}
                      className="w-full p-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Highway Efficiency (km/L)</label>
                    <input
                      type="number"
                      min="5" max="25" step="0.5"
                      value={fuelData.consumption}
                      onChange={(e) => setFuelData({ ...fuelData, consumption: +e.target.value })}
                      className="w-full p-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Current Fuel (%)</label>
                    <input
                      type="range"
                      min="0" max="100" step="5"
                      value={fuelData.currentFuel}
                      onChange={(e) => setFuelData({ ...fuelData, currentFuel: +e.target.value })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm text-slate-800">{fuelData.currentFuel}%</span>
                  </div>
                </div>
              </div>

              {/* quick trip presets removed - location & distance now come from the map */}
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-slate-200">
              {tripAnalysis && <SuitabilityBadge analysis={tripAnalysis} />}
              <div className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
                <span>Map provides live distance</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all">
                Close
              </button>
            </div>
          </div>
        </aside>
      </div>

      {!isJourneyActive && <Features />}

    </div>
  );
}