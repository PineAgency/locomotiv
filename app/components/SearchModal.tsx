'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCallback: (location: { lat: number; lng: number; address: string }) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectCallback }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  // Hidden div for PlacesService attribution if needed (though we're using AutocompleteService mainly)
  const placesDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !autocompleteService.current && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (isOpen && !placesService.current && window.google && placesDivRef.current) {
        placesService.current = new window.google.maps.places.PlacesService(placesDivRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setPredictions([]);
      return;
    }

    if (autocompleteService.current) {
      setLoading(true);
      autocompleteService.current.getPlacePredictions(
        { input: query },
        (results, status) => {
          setLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }
  }, [query]);

  const handleSelect = (placeId: string, description: string) => {
    if (!placesService.current) return;

    setLoading(true);
    placesService.current.getDetails(
      { placeId, fields: ['geometry', 'formatted_address', 'name'] },
      (place, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || description;
          
          onSelectCallback({ lat, lng, address });
          onClose();
        } else {
            console.error('Failed to get place details');
        }
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Search Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-6 h-6 text-slate-400" />
          <input
            type="text"
            className="flex-1 text-lg font-medium outline-none placeholder:text-slate-400 text-slate-900"
            placeholder="Search for a location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto bg-slate-50">
          {!query && (
            <div className="p-8 text-center text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Type to find a destination</p>
            </div>
          )}

          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelect(prediction.place_id, prediction.description)}
              className="w-full text-left p-4 hover:bg-white border-b border-slate-100 hover:shadow-sm transition-all flex items-start gap-3 group"
            >
              <div className="mt-1 bg-white p-2 rounded-full border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-blue-700">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-sm text-slate-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
          
          {query && predictions.length === 0 && !loading && (
             <div className="p-4 text-center text-slate-500">No results found</div>
          )}
        </div>
        
        {/* Hidden map div for PlacesService */}
        <div ref={placesDivRef} style={{ display: 'none' }}></div>
      </div>
    </div>
  );
}
