import React, { useState } from 'react';
import { LocationPickerModal } from './LocationPickerModal';

/**
 * LocationPromo Component
 * 
 * This is a standalone component designed to be easily copied to other websites.
 * It includes the redesigned "Select Location" card and the interactive map picker.
 * 
 * Requirements:
 * - Tailwind CSS
 * - Lucide React (icons)
 * - Leaflet (for the map)
 * - Motion (for animations)
 */

interface LocationPromoProps {
  onLocationSelect?: (location: { address: string; lat: number; lng: number }) => void;
  language?: 'ku' | 'ar' | 'en' | 'tr';
}

export const LocationPromo: React.FC<LocationPromoProps> = ({ 
  onLocationSelect, 
  language = 'en' 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  // Simple translation helper for standalone use
  const t = (key: string) => {
    const strings: any = {
      en: {
        yourLocationOnMap: "Your location on the map",
        optional: "optional",
        selectYourLocation: "Select your location",
        selectLocation: "Select Location",
        tapOnMap: "Tap on map or use GPS",
        useMyLocation: "Use My Location",
        selectedAddress: "Selected Address",
        gettingAddress: "Getting address...",
        pleaseSelectPoint: "Please select a point on the map",
        confirmLocation: "Confirm Location",
        geolocationNotSupported: "Geolocation is not supported",
        unableToRetrieveLocation: "Unable to retrieve location"
      },
      ku: {
        yourLocationOnMap: "شوێنەکەت لەسەر نەخشە",
        optional: "ئارەزوومەندانە",
        selectYourLocation: "شوێنەکەت دیاری بکە",
        selectLocation: "دیاریکردنی شوێن",
        tapOnMap: "لەسەر نەخشەکە کلیک بکە یان GPS بەکاربهێنە",
        useMyLocation: "شوێنی ئێستام بەکاربهێنە",
        selectedAddress: "ناونیشانی هەڵبژێردراو",
        gettingAddress: "وەرگرتنی ناونیشان...",
        pleaseSelectPoint: "تکایە خاڵێک لەسەر نەخشەکە هەڵبژێرە",
        confirmLocation: "پەسەندکردنی شوێن",
        geolocationNotSupported: "گەڕان بەدوای شوێن پاڵپشتی ناکرێت",
        unableToRetrieveLocation: "نەتوانرا شوێنەکەت دیاری بکرێت"
      },
      ar: {
        yourLocationOnMap: "موقعك على الخريطة",
        optional: "اختياري",
        selectYourLocation: "حدد موقعك",
        selectLocation: "تحديد الموقع",
        tapOnMap: "اضغط على الخريطة أو استخدم GPS",
        useMyLocation: "استخدام موقعي الحالي",
        selectedAddress: "العنوان المختار",
        gettingAddress: "جاري الحصول على العنوان...",
        pleaseSelectPoint: "يرجى اختيار نقطة على الخريطة",
        confirmLocation: "تأكيد الموقع",
        geolocationNotSupported: "تحديد الموقع غير مدعوم",
        unableToRetrieveLocation: "تعذر الحصول على موقعك"
      }
    };
    return strings[language]?.[key] || strings['en'][key] || key;
  };

  const handleConfirm = (location: { address: string; lat: number; lng: number }) => {
    setSelectedAddress(location.address);
    setShowPicker(false);
    if (onLocationSelect) onLocationSelect(location);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="w-full border-2 border-dashed border-white/10 rounded-2xl p-6 bg-white/5 relative shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-2 mb-4">
          <span className="text-lg">📍</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-300">
              {t('yourLocationOnMap')} <span className="text-xs font-normal text-gray-500">({t('optional')})</span>
            </p>
          </div>
          <span className="text-red-500 text-lg leading-none">*</span>
        </div>
        
        <button
          onClick={() => setShowPicker(true)}
          className="bg-[#8B2323] hover:bg-[#7a1f1f] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-black/20"
        >
          {t('selectYourLocation')}
        </button>

        {selectedAddress && (
          <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('selectedAddress')}</p>
            <p className="text-sm text-gray-300 line-clamp-2">{selectedAddress}</p>
          </div>
        )}
      </div>

      <LocationPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleConfirm}
        language={language}
        t={t}
      />
    </div>
  );
};
