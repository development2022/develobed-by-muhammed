/**
 * Audio assets and playback logic
 */

// Options for sounds:
// 1. Put in public/alerts.wav -> access via '/alerts.wav' (Current default)
// 2. Put in src/lib/raw/alerts.wav -> access via import (Vite handles it)

const ALERT_SOUND_PATH = '/alerts.wav';
const FALLBACK_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_78330a613f.mp3';

class SoundService {
  private static instance: SoundService;
  private audio: HTMLAudioElement | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // We use a relative path from the domain root. 
      // If you upload 'alerts.wav' to the 'public' folder, it will work.
      this.audio = new Audio(ALERT_SOUND_PATH);
      this.fallbackAudio = new Audio(FALLBACK_URL);
    }
  }

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  /**
   * Plays the alert sound.
   */
  async playAlert() {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.audio) {
        this.audio.currentTime = 0;
        await this.audio.play().catch(async (err) => {
          console.warn("Primary sound (/alerts.wav) missing or failed, playing fallback:", err);
          if (this.fallbackAudio) {
            this.fallbackAudio.currentTime = 0;
            await this.fallbackAudio.play();
          }
        });
      }
    } catch (error) {
      console.warn("Audio playback blocked by browser/failed:", error);
    }
  }

  playOrderSuccess() {
    this.playAlert();
  }
}

export const soundService = SoundService.getInstance();
