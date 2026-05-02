/**
 * Audio assets and playback logic
 */

// 1. UPLOAD your alert.mp3 to src/lib/
// 2. UNCOMMENT the line below:
// import alertSound from './alert.mp3';

// Fallback sound for testing (Pixabay royalty-free)
const FALLBACK_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_78330a613f.mp3';

class SoundService {
  private static instance: SoundService;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // 3. CHANGE this to use alertSound after uncommenting the import above:
      this.audio = new Audio(FALLBACK_URL);
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
   * If you upload src/lib/alert.mp3, you can modify this to use the local file.
   */
  async playAlert() {
    if (!this.audio) return;
    
    try {
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.warn("Audio playback blocked or failed:", error);
    }
  }

  // Helper for order success
  playOrderSuccess() {
    this.playAlert();
  }
}

export const soundService = SoundService.getInstance();
