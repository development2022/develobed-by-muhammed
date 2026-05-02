import React from 'react';
import { LocationPromo } from './components/LocationPromo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface LocationPromoPageProps {
  setCurrentView: (view: any) => void;
}

export default function LocationPromoPage({ setCurrentView }: LocationPromoPageProps) {
  const [copied, setCopied] = React.useState(false);

  const codeSnippet = `
// 1. Install dependencies:
// npm install leaflet lucide-react motion react-leaflet

// 2. Add Leaflet CSS to your index.html:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

// 3. Copy the LocationPromo.tsx and LocationPickerModal.tsx files
// to your project and import them:
import { LocationPromo } from './components/LocationPromo';

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <LocationPromo 
        language="en" 
        onLocationSelect={(loc) => console.log(loc)} 
      />
    </div>
  );
}
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Location Picker <span className="text-[#8B2323]">Widget</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The professional map location selector I built for you. 
            You can now use this standalone widget on any of your other websites.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#8B2323] rounded-lg flex items-center justify-center text-sm">01</span>
              Live Preview
            </h2>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
              <LocationPromo language="en" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#8B2323] rounded-lg flex items-center justify-center text-sm">02</span>
              How to use
            </h2>
            <div className="space-y-4 text-gray-400">
              <p className="flex items-start gap-3">
                <Check className="text-emerald-500 mt-1 shrink-0" size={18} />
                <span>Fully responsive and mobile-ready design.</span>
              </p>
              <p className="flex items-start gap-3">
                <Check className="text-emerald-500 mt-1 shrink-0" size={18} />
                <span>Integrated with OpenStreetMap (No API key required).</span>
              </p>
              <p className="flex items-start gap-3">
                <Check className="text-emerald-500 mt-1 shrink-0" size={18} />
                <span>Supports Kurdish, Arabic, English, and Turkish.</span>
              </p>
              <p className="flex items-start gap-3">
                <Check className="text-emerald-500 mt-1 shrink-0" size={18} />
                <span>Automatic address detection using GPS.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#151515] rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Integration Guide</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs font-bold hover:text-white transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-6 overflow-x-auto text-sm font-mono text-emerald-500/80">
            {codeSnippet}
          </pre>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => setCurrentView('home')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold"
          >
            Back to main website
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
