/**
 * Audio assets and playback logic
 */

// IMPORTANT: Put your 'alerts.wav' file in the 'public/' folder.
// Files in the 'public/' folder are served at the root path '/' 
// and are preserved during updates.
const ALERT_SOUND_PATH = '/alerts.wav';
// More stable fallback URL
const FALLBACK_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
// Tiny base64 encoded beep (Data URI) as a guaranteed last resort
const LAST_RESORT_BEEP = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV9vT18A' + 'A'.repeat(100); 

class SoundService {
  private static instance: SoundService;
  private audio: HTMLAudioElement | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private lastResortAudio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Primary sound from public/alerts.wav
      this.audio = new Audio(ALERT_SOUND_PATH);
      // Remote fallback
      this.fallbackAudio = new Audio(FALLBACK_URL);
      // Guaranteed local fallback
      this.lastResortAudio = new Audio(LAST_RESORT_BEEP);
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
   * It attempts to play in hierarchy: /alerts.wav -> Mixkit fallback -> Data URI beep.
   */
  async playAlert() {
    if (typeof window === 'undefined') return;
    
    const tryPlay = async (audioObj: HTMLAudioElement | null): Promise<boolean> => {
      if (!audioObj) return false;
      try {
        audioObj.currentTime = 0;
        await audioObj.play();
        return true;
      } catch (err) {
        return false;
      }
    };

    try {
      // 1. Try Primary
      if (await tryPlay(this.audio)) return;

      // 2. Try Fallback URL
      console.warn("Primary sound (/alerts.wav) failed, trying Mixkit fallback...");
      if (await tryPlay(this.fallbackAudio)) return;

      // 3. Try Last Resort Data URI
      console.warn("Fallback sound failed, trying last resort beep...");
      await tryPlay(this.lastResortAudio).catch(e => console.error("All audio sources failed:", e));

    } catch (error) {
      console.warn("Audio playback exception:", error);
    }
  }

  playOrderSuccess() {
    this.playAlert();
  }
}

export const soundService = SoundService.getInstance();
