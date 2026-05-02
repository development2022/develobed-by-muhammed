import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: { address: string; lat: number; lng: number }) => void;
  language: string;
  t: (key: string) => string;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  language,
  t
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const defaultCenter: [number, number] = [36.1901, 44.0091]; // Erbil, Kurdistan

  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstance.current) {
      // Initialize map
      mapInstance.current = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      // Handle map clicks
      mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
      });

      // Force a resize check after a short delay to ensure the container is fully rendered
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      if (!isOpen && mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [isOpen]);

  const updateMarker = async (lat: number, lng: number) => {
    if (!mapInstance.current) return;

    // Update marker position
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng]);
    } else {
      markerInstance.current = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      }).addTo(mapInstance.current);
    }

    mapInstance.current.panTo([lat, lng]);

    // Reverse Geocode
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language === 'en' ? 'en' : 'ku'}`);
      const data = await response.json();
      let address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      // If language is Kurdish, try to ensure it's in Sorani (Arabic script)
      if (language === 'ku' && /[a-zA-Z]/.test(address)) {
        try {
          const apiKey = (window as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY;
          if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const translationResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Translate this address into Kurdish Sorani (Arabic script). Return ONLY the translated address text. Address: "${address}"`,
            });
            if (translationResponse.text) {
              address = translationResponse.text.trim();
            }
          }
        } catch (transError) {
          console.error("Address translation error:", transError);
        }
      }
      
      setSelectedLocation({ address, lat, lng });
    } catch (error) {
      console.error("Geocoding error:", error);
      setSelectedLocation({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert(t('geolocationNotSupported'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMarker(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert(t('unableToRetrieveLocation'));
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#1a1a1a] w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            style={{ height: '80vh' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{t('selectLocation')}</h3>
                  <p className="text-xs text-gray-500">{t('tapOnMap')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="w-full h-full z-0" />
              
              {/* GPS Button Overlay */}
              <button
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="absolute top-4 right-4 z-[400] bg-white text-gray-900 p-3 rounded-2xl shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2 font-bold text-sm"
              >
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                {t('useMyLocation')}
              </button>

              {/* Center Crosshair (Optional, but map click is better) */}
              {!selectedLocation && !isLocating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
                  <div className="w-8 h-8 border-2 border-emerald-600 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">
                  {t('selectedAddress')}
                </p>
                <div className="bg-white/5 p-3 rounded-xl min-h-[3rem] flex items-center">
                  {isGeocoding ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      {t('gettingAddress')}
                    </div>
                  ) : selectedLocation ? (
                    <p className="text-sm leading-relaxed">{selectedLocation.address}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t('pleaseSelectPoint')}
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={!selectedLocation || isGeocoding}
                onClick={() => selectedLocation && onConfirm(selectedLocation)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Check size={20} />
                {t('confirmLocation')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
