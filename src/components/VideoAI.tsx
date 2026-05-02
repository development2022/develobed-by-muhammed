import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, FileText, Sparkles, Clock, Layout, Play, Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface VideoAIProps {
  t: (key: string) => string;
}

export const VideoAI: React.FC<VideoAIProps> = ({ t }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'moments' | 'flashcards' | 'marketing'>('summary');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit for demo
        setError(t('videoTooLarge'));
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError(null);
      setResult(null);
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setError("Gemini API key is not configured. Please check your settings.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(videoFile);
      });

      const base64Data = await base64Promise;

      const prompt = `
        Analyze this video content and provide the following in JSON format:
        1. "summary": A concise summary of the video.
        2. "moments": A list of key moments with "timestamp" (e.g. 0:45) and "description".
        3. "flashcards": A list of 3-5 flashcards with "question" and "answer".
        4. "marketing": 3 catchy marketing highlights or hooks.
        
        Return ONLY the JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: videoFile.type,
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err: any) {
      console.error("Video analysis error:", err);
      setError(t('analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/20"
        >
          <Video className="text-white" size={40} />
        </motion.div>
        <h1 className="text-4xl font-bold mb-4">{t('videoAiTitle')}</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          {t('videoAiSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div 
            onClick={() => !videoFile && fileInputRef.current?.click()}
            className={`relative aspect-video rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${
              videoFile 
                ? 'border-red-600/50 bg-black' 
                : 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer'
            }`}
          >
            {videoPreview ? (
              <>
                <video 
                  src={videoPreview} 
                  className="w-full h-full object-contain"
                  controls
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeVideo(); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="text-red-600" size={32} />
                </div>
                <p className="font-bold mb-2">{t('uploadVideo')}</p>
                <p className="text-xs text-gray-500">{t('maxSize20MB')}</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-600 text-sm flex items-center gap-3">
              <X size={18} />
              {error}
            </div>
          )}

          <button
            disabled={!videoFile || isAnalyzing}
            onClick={analyzeVideo}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              !videoFile || isAnalyzing
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t('startAnalysis')}
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 p-6 min-h-[400px] flex flex-col">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 opacity-50">
              <Layout size={48} className="mb-4" />
              <p>{t('analysisResultsAppearHere')}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: 'summary', icon: FileText, label: t('summary') },
                  { id: 'moments', icon: Clock, label: t('keyMoments') },
                  { id: 'flashcards', icon: Layout, label: t('flashcards') },
                  { id: 'marketing', icon: Sparkles, label: t('marketing') }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === 'summary' && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="text-red-600" size={20} />
                        {t('videoSummary')}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {result.summary}
                      </p>
                    </motion.div>
                  )}

                  {activeTab === 'moments' && (
                    <motion.div
                      key="moments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Clock className="text-red-600" size={20} />
                        {t('keyMoments')}
                      </h3>
                      <div className="space-y-3">
                        {result.moments?.map((moment: any, i: number) => (
                          <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-red-600/30 transition-all">
                            <div className="text-red-600 font-mono font-bold text-sm bg-red-600/10 h-fit px-3 py-1 rounded-lg">
                              {moment.timestamp}
                            </div>
                            <p className="text-sm text-gray-300">{moment.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'flashcards' && (
                    <motion.div
                      key="flashcards"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Layout className="text-red-600" size={20} />
                        {t('flashcards')}
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {result.flashcards?.map((card: any, i: number) => (
                          <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-2">{t('question')} {i + 1}</p>
                            <p className="font-bold text-white mb-3">{card.question}</p>
                            <div className="pt-3 border-t border-white/5">
                              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t('answer')}</p>
                              <p className="text-sm text-gray-400">{card.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'marketing' && (
                    <motion.div
                      key="marketing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="text-red-600" size={20} />
                        {t('marketingHighlights')}
                      </h3>
                      <div className="space-y-4">
                        {result.marketing?.map((hook: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-red-600/5 rounded-2xl border border-red-600/10">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-white font-medium italic">"{hook}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
