'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Car, Calendar, Shield, Zap, Award, TrendingUp, 
  ArrowRight, X, MapPin, Fuel, AlertCircle, Clock, Navigation
} from 'lucide-react';

export default function CarLandingPage() {
  const [selection, setSelection] = useState({ year: '2024', make: '', model: '' });
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState({ makes: false, models: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicleSpecs, setVehicleSpecs] = useState(null);
  
  // Map & Trip States
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Fuel efficiency data (editable by user)
  const [fuelData, setFuelData] = useState({
    tankCapacity: 50,
    consumption: 12,
    fuelType: 'Petrol'
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchMakes = async () => {
      setLoading(prev => ({ ...prev, makes: true }));
      try {
        const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json');
        const data = await res.json();
        setMakes(data.Results.sort((a, b) => a.MakeName.localeCompare(b.MakeName)));
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
          setModels(data.Results || []);
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

  const handleChange = (e) => {
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
      
      // Simulate vehicle specs (in production, fetch from real API)
      setVehicleSpecs({
        year: selection.year,
        make: selection.make,
        model: selection.model,
        tankCapacity: 50,
        consumption: 12,
        fuelType: 'Petrol'
      });
      
      // Reset map data
      setOrigin(null);
      setDestination(null);
      setTripData(null);
    }
  };

  const calculateTrip = async () => {
    if (!origin || !destination) return;
    
    setCalculatingRoute(true);
    
    try {
      // Calculate distance using Haversine formula (straight line)
      const R = 6371; // Earth's radius in km
      const dLat = (destination.lat - origin.lat) * Math.PI / 180;
      const dLon = (destination.lng - origin.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      
      // Add 20% for road distance (rough estimate)
      const roadDistanceKm = distanceKm * 1.2;
      
      // Calculate fuel needs
      const fuelNeeded = roadDistanceKm / fuelData.consumption;
      const fullTanks = Math.ceil(fuelNeeded / fuelData.tankCapacity);
      const fuelStops = Math.max(0, fullTanks - 1);
      
      // Calculate time (assuming 80 km/h average speed + 15 min per fuel stop)
      const drivingTimeHours = roadDistanceKm / 80;
      const stopTimeHours = fuelStops * 0.25; // 15 minutes per stop
      const totalTimeHours = drivingTimeHours + stopTimeHours;
      
      // Calculate cost (₦835 per liter - 2024 Nigeria average)
      const fuelCost = fuelNeeded * 835;
      
      // Calculate suitability score
      const maxRange = fuelData.tankCapacity * fuelData.consumption;
      const suitabilityScore = Math.min(100, Math.round((maxRange / roadDistanceKm) * 100));
      
      setTripData({
        distanceKm: Math.round(roadDistanceKm),
        straightLineKm: Math.round(distanceKm),
        fuelNeeded: Math.round(fuelNeeded * 10) / 10,
        fuelStops,
        totalTimeHours: Math.round(totalTimeHours * 10) / 10,
        drivingTimeHours: Math.round(drivingTimeHours * 10) / 10,
        fuelCost: Math.round(fuelCost),
        suitabilityScore,
        maxRange: Math.round(maxRange)
      });
    } catch (err) {
      console.error('Failed to calculate trip', err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  useEffect(() => {
    if (origin && destination && vehicleSpecs) {
      calculateTrip();
    }
  }, [origin, destination, fuelData]);

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 shadow-2xl">
              <Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Plan Your Trip With
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Perfect Vehicle
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Select your car, plan your route, calculate fuel needs and travel time instantly
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
                <select
                  name="year"
                  value={selection.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Make</label>
                <select
                  name="make"
                  value={selection.make}
                  disabled={loading.makes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium disabled:opacity-50"
                >
                  <option value="">Select Make</option>
                  {makes.map(m => (
                    <option key={m.MakeId} value={m.MakeName}>{m.MakeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                <select
                  name="model"
                  value={selection.model}
                  disabled={!selection.make || loading.models}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white text-slate-900 font-medium disabled:opacity-50"
                >
                  <option value="">Select Model</option>
                  {models.map(m => (
                    <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={!selection.make || !selection.model}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Analysis Section (shows when sidebar is open and locations are selected) */}
      {sidebarOpen && tripData && (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Trip Analysis: {selection.make} {selection.model}
              </h2>
              <p className="text-xl text-slate-600">
                {tripData.distanceKm}km journey • {formatTime(tripData.totalTimeHours)} estimated time
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 mx-auto">
                  <Navigation className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 text-center">{tripData.distanceKm}km</div>
                <div className="text-slate-600 text-center mt-2">Total Distance</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 mx-auto">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 text-center">{formatTime(tripData.totalTimeHours)}</div>
                <div className="text-slate-600 text-center mt-2">Travel Time</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4 mx-auto">
                  <Fuel className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 text-center">{tripData.fuelNeeded}L</div>
                <div className="text-slate-600 text-center mt-2">{tripData.fuelStops} Fuel Stops</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 mx-auto">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 text-center">₦{tripData.fuelCost.toLocaleString()}</div>
                <div className="text-slate-600 text-center mt-2">Fuel Cost</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className={`inline-flex items-center px-6 py-3 rounded-full font-bold text-lg mb-6 ${
                tripData.suitabilityScore >= 70 
                  ? 'bg-green-100 text-green-800' 
                  : tripData.suitabilityScore >= 40
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tripData.suitabilityScore >= 70 ? '✓ Excellent' : tripData.suitabilityScore >= 40 ? '⚠ Moderate' : '✗ Challenging'} Trip Suitability: {tripData.suitabilityScore}%
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Trip Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Straight-line distance:</span>
                      <span className="font-semibold">{tripData.straightLineKm}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Est. road distance:</span>
                      <span className="font-semibold">{tripData.distanceKm}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Driving time:</span>
                      <span className="font-semibold">{formatTime(tripData.drivingTimeHours)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fuel stops:</span>
                      <span className="font-semibold">{tripData.fuelStops} stops</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-4">Vehicle Performance</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max range:</span>
                      <span className="font-semibold">{tripData.maxRange}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fuel efficiency:</span>
                      <span className="font-semibold">{fuelData.consumption}km/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tank capacity:</span>
                      <span className="font-semibold">{fuelData.tankCapacity}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fuel type:</span>
                      <span className="font-semibold">{fuelData.fuelType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-0 z-50 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          onClick={() => setSidebarOpen(false)} 
          className={`fixed inset-0 bg-black transition-opacity ${sidebarOpen ? 'opacity-50' : 'opacity-0'}`} 
        />
        
        <aside className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selection.year} {selection.make}</h3>
                <p className="text-lg text-slate-600">{selection.model}</p>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Fuel Data Editor */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                <Fuel className="w-5 h-5 mr-2 text-blue-600" />
                Vehicle Fuel Specifications
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tank Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="150"
                    value={fuelData.tankCapacity}
                    onChange={(e) => setFuelData({...fuelData, tankCapacity: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fuel Consumption (km/L)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    step="0.5"
                    value={fuelData.consumption}
                    onChange={(e) => setFuelData({...fuelData, consumption: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    value={fuelData.fuelType}
                    onChange={(e) => setFuelData({...fuelData, fuelType: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Map Instructions */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 mb-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Plan Your Route
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">Origin</div>
                    <div className="text-xs text-slate-600">
                      {origin ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}` : 'Click map to set origin'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">Destination</div>
                    <div className="text-xs text-slate-600">
                      {destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : 'Click map to set destination'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-xl">
                <p className="text-sm text-blue-900">
                  💡 <strong>Instructions:</strong> Click once on the map below to set your origin (starting point), then click again to set your destination. The route will be calculated automatically.
                </p>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden mb-6">
              <div 
                className="w-full h-96 bg-slate-100 cursor-crosshair relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Convert click to lat/lng (simplified for Lagos area)
                  const lat = 6.5 + (0.5 - y / rect.height) * 2;
                  const lng = 3.4 + (x / rect.width) * 2;
                  
                  if (!origin) {
                    setOrigin({ lat, lng });
                  } else if (!destination) {
                    setDestination({ lat, lng });
                  } else {
                    // Reset and start over
                    setOrigin({ lat, lng });
                    setDestination(null);
                  }
                }}
              >
                {/* Map Grid Background */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(rgba(100,100,100,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                {/* Map Label */}
                <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="text-sm font-bold text-slate-900">Interactive Map</div>
                  <div className="text-xs text-slate-600">Click to set origin & destination</div>
                </div>

                {/* Origin Marker */}
                {origin && (
                  <div 
                    className="absolute w-10 h-10 -ml-5 -mt-10"
                    style={{
                      left: `${((origin.lng - 3.4) / 2) * 100}%`,
                      top: `${((0.5 - (origin.lat - 6.5) / 2)) * 100}%`
                    }}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white">
                      A
                    </div>
                  </div>
                )}

                {/* Destination Marker */}
                {destination && (
                  <div 
                    className="absolute w-10 h-10 -ml-5 -mt-10"
                    style={{
                      left: `${((destination.lng - 3.4) / 2) * 100}%`,
                      top: `${((0.5 - (destination.lat - 6.5) / 2)) * 100}%`
                    }}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white">
                      B
                    </div>
                  </div>
                )}

                {/* Route Line */}
                {origin && destination && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${((origin.lng - 3.4) / 2) * 100}%`}
                      y1={`${((0.5 - (origin.lat - 6.5) / 2)) * 100}%`}
                      x2={`${((destination.lng - 3.4) / 2) * 100}%`}
                      y2={`${((0.5 - (destination.lat - 6.5) / 2)) * 100}%`}
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {origin && destination && (
                <button
                  onClick={calculateTrip}
                  disabled={calculatingRoute}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Navigation className="w-5 h-5" />
                  <span>{calculatingRoute ? 'Calculating...' : 'Calculate Route'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setOrigin(null);
                  setDestination(null);
                  setTripData(null);
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 rounded-xl transition-all"
              >
                Reset Map
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}