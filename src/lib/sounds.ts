/**
 * Audio assets and playback logic
 */

// IMPORTANT: Put your 'alerts.wav' file in the 'public/' folder.
// Files in the 'public/' folder are served at the root path '/' 
// and are preserved during updates.
// More stable fallback URL
const FALLBACK_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
// Tiny base64 encoded beep (Data URI) as a guaranteed last resort
const LAST_RESORT_BEEP = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV9vT18A' + 'A'.repeat(100); 

// Potential primary sound paths. 
// Note: If adding a file to src/lib/raw, it's best to import it at the top level 
// so Vite handles the asset correctly in production builds.
const PRIMARY_SOUND_PATHS = [
  '/alerts.wav',              // Root/public folder
  '/src/lib/raw/alerts.wav'   // Raw source folder (if served by dev server)
];

class SoundService {
  private static instance: SoundService;
  private audioArray: HTMLAudioElement[] = [];
  private fallbackAudio: HTMLAudioElement | null = null;
  private lastResortAudio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Initialize multiple potential primary sources
      this.audioArray = PRIMARY_SOUND_PATHS.map(path => new Audio(path));
      
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
   * hierarchy: /alerts.wav -> /src/lib/raw/alerts.wav -> Mixkit fallback -> Data URI beep.
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
      // 1. Try Primary sources
      for (const audio of this.audioArray) {
        if (await tryPlay(audio)) return;
      }

      // 2. Try Fallback URL
      console.warn("Primary sounds failed, trying remote fallback...");
      if (await tryPlay(this.fallbackAudio)) return;

      // 3. Try Last Resort Data URI
      console.warn("All primary and remote sounds failed, using last resort beep...");
      await tryPlay(this.lastResortAudio).catch(e => console.error("Total silence:", e));

    } catch (error) {
      console.warn("Audio playback exception:", error);
    }
  }

  playOrderSuccess() {
    this.playAlert();
  }
}

export const soundService = SoundService.getInstance();
