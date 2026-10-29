// Voice Service using Web Speech API with Mobile and Desktop Support
// Supported on Chrome, Edge, Safari (Desktop & Mobile iOS/Android)

import { sound } from './sound.js';

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentTranscript: string = '';
  private activeOnEnd?: () => void;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
      } catch (e) {
        console.warn('SpeechRecognition initialization failed:', e);
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      ('MediaRecorder' in window && navigator.mediaDevices)
    );
  }

  public startListening(options: VoiceRecognitionOptions): boolean {
    if (typeof window === 'undefined') return false;

    // Stop any AI TTS output immediately so voice never bleeds into the microphone
    sound.stopSpeaking();

    // If already listening in another component, stop and notify it cleanly first
    if (this.isListening) {
      this.stopListening();
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (options.onError) {
        options.onError(
          'Browser Anda belum mendukung Speech Recognition. Silakan gunakan Google Chrome, Microsoft Edge, atau Safari terbaru.'
        );
      }
      return false;
    }

    try {
      const rec = new SpeechRecognition();
      this.recognition = rec;
      this.activeOnEnd = options.onEnd;

      rec.lang = options.lang || 'id-ID'; // Bahasa Indonesia
      rec.continuous = options.continuous !== undefined ? options.continuous : true;
      rec.interimResults =
        options.interimResults !== undefined ? options.interimResults : true;
      rec.maxAlternatives = 1;

      this.currentTranscript = '';

      rec.onstart = () => {
        this.isListening = true;
        if (options.onStart) options.onStart();
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = (final || interim).trim();
        if (combined) {
          this.currentTranscript = combined;
          if (options.onResult) {
            options.onResult(combined, !!final);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'aborted') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error);
        let errorMsg = 'Terjadi kesalahan pada mikrofon.';
        if (event.error === 'not-allowed') {
          errorMsg =
            'Izin akses mikrofon ditolak. Harap izinkan akses mikrofon di pengaturan browser Anda.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'Tidak ada suara yang terdeteksi. Silakan coba bicara kembali.';
        } else if (event.error === 'network') {
          errorMsg = 'Koneksi jaringan terputus saat mengenali suara.';
        }

        this.isListening = false;
        if (options.onError) options.onError(errorMsg);
      };

      rec.onend = () => {
        if (this.recognition === rec) {
          this.isListening = false;
        }
        const cb = this.activeOnEnd;
        if (cb && this.recognition === rec) {
          this.activeOnEnd = undefined;
          cb();
        }
      };

      rec.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      this.activeOnEnd = undefined;
      console.error('startListening error:', err);
      if (options.onError) {
        options.onError(err.message || 'Gagal memulai perekaman suara.');
      }
      return false;
    }
  }

  public stopListening(): void {
    const prevOnEnd = this.activeOnEnd;
    this.activeOnEnd = undefined;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListening = false;
    }
    if (prevOnEnd) {
      try {
        prevOnEnd();
      } catch (_) {}
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();
