import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface LiveSupportProps {
  language: string;
  t: (key: string) => string;
}

export const LiveSupport: React.FC<LiveSupportProps> = ({ language, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('supportWelcome'),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is missing");
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "API key is not configured. Please check your settings.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a customer support assistant for "Sherdll Nuts" (چەرەزاتی شێردڵ), a premium nut and snack store in Kurdistan. 
        Answer the user's question in ${language === 'en' ? 'English' : language === 'tr' ? 'Turkish' : 'Kurdish'}. 
        Be polite, helpful, and concise. 
        User question: "${input}"`,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || t('supportError'),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Support Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('supportError'),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[100] lg:bottom-10 lg:right-10">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[350px] max-w-[90vw] h-[500px] bg-[#1a1a1a] rounded-[32px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
            dir={language === 'en' || language === 'tr' ? 'ltr' : 'rtl'}
          >
            {/* Header */}
            <div className="p-6 bg-emerald-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t('supportTitle')}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-80">{t('onlineNow')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                    <div className={`text-[9px] mt-1.5 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/5 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span className="text-xs text-gray-500">{t('typing')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('typeMessage')}
                className="flex-1 bg-[#262626] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                <Send size={20} className={language === 'en' || language === 'tr' ? '' : 'rotate-180'} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ${
          isOpen ? 'bg-white/10 text-emerald-600' : 'bg-emerald-600'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};
