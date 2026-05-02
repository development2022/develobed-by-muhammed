/**
 * Audio assets and playback logic
 */

export const SOUND_URLS = {
  ORDER_SUCCESS: '/sounds/order-success.mp3',
  NOTIFICATION: '/sounds/notification.mp3',
};

class SoundService {
  private static instance: SoundService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private constructor() {}

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  play(url: string) {
    try {
      let audio = this.audioCache.get(url);
      if (!audio) {
        audio = new Audio(url);
        this.audioCache.set(url, audio);
      }
      
      // Reset sound if it's already playing
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.warn("Audio playback interrupted or blocked by browser:", err);
      });
    } catch (error) {
      console.error("Sound playback error:", error);
    }
  }

  playOrderSuccess() {
    this.play(SOUND_URLS.ORDER_SUCCESS);
  }

  playNotification() {
    this.play(SOUND_URLS.NOTIFICATION);
  }
}

export const soundService = SoundService.getInstance();
