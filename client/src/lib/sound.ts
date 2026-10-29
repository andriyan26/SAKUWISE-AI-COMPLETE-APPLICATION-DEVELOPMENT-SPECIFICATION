import { BASE_URL } from './api-client.js';

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  onEnd?: () => void;
  onError?: () => void;
}

const SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

/**
 * Converts a non-negative integer into natural spoken Indonesian words ("terbilang").
 */
export function numberToIndonesianWords(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'nol';
  if (num < 12) return SATUAN[num];
  if (num < 20) return `${SATUAN[num - 10]} belas`;
  if (num < 100) {
    const puluh = Math.floor(num / 10);
    const sisa = num % 10;
    return `${SATUAN[puluh]} puluh${sisa > 0 ? ' ' + SATUAN[sisa] : ''}`;
  }
  if (num < 200) {
    const sisa = num - 100;
    return `seratus${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (num < 1000) {
    const ratus = Math.floor(num / 100);
    const sisa = num % 100;
    return `${SATUAN[ratus]} ratus${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (num < 2000) {
    const sisa = num - 1000;
    return `seribu${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (num < 1_000_000) {
    const ribu = Math.floor(num / 1000);
    const sisa = num % 1000;
    return `${numberToIndonesianWords(ribu)} ribu${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (num < 1_000_000_000) {
    // Natural conversational shortcut: e.g., 1.500.000 -> "satu setengah juta"
    if (num === 1_500_000) return 'satu setengah juta';
    const juta = Math.floor(num / 1_000_000);
    const sisa = num % 1_000_000;
    return `${numberToIndonesianWords(juta)} juta${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (num < 1_000_000_000_000) {
    const miliar = Math.floor(num / 1_000_000_000);
    const sisa = num % 1_000_000_000;
    return `${numberToIndonesianWords(miliar)} miliar${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  return num.toLocaleString('id-ID');
}

/**
 * Transforms raw UI/AI text into warm, natural conversational Indonesian speech.
 * Strips emojis/markdown, converts Rp currency & percentages into natural words,
 * and normalizes brand/fintech phonetics so TTS sounds genuinely human.
 */
export function humanizeIndonesianSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown links [label](url) -> label, and strip raw URLs
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/https?:\/\/\S+/gi, '');

  // 2. Remove all Unicode emojis, pictographs, and decorative symbols
  text = text.replace(
    /[\u{1F100}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
    ''
  );

  // 3. Remove markdown formatting symbols (*, _, #, `, ~, >, •)
  text = text.replace(/[*_#`~>•]+/g, ' ');

  // 4. Convert Rupiah amounts (e.g., "Rp 1.500.000", "Rp50.000", "Rp 0") into natural spoken words
  text = text.replace(
    /\b(?:Rp\.?|IDR)\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?\b/gi,
    (_match, digits: string) => {
      const cleanDigits = digits.replace(/\./g, '');
      const val = parseInt(cleanDigits, 10);
      if (isNaN(val)) return _match;
      return `${numberToIndonesianWords(val)} rupiah`;
    }
  );

  // 5. Convert percentages (e.g., "35%", "12,5%", "12.5%") into natural words
  text = text.replace(/(\d+)(?:[.,](\d+))?\s*%/g, (_match, whole: string, dec?: string) => {
    const w = parseInt(whole, 10);
    const wholeWords = isNaN(w) ? whole : numberToIndonesianWords(w);
    if (dec !== undefined) {
      const d = parseInt(dec, 10);
      const decWords = isNaN(d) ? dec : numberToIndonesianWords(d);
      return `${wholeWords} koma ${decWords} persen`;
    }
    return `${wholeWords} persen`;
  });

  // 6. Convert number ranges like "3-6 bulan" -> "tiga sampai enam bulan"
  text = text.replace(/\b(\d+)\s*-\s*(\d+)\s+(bulan|hari|tahun|kali|minggu)\b/gi, (_m, a, b, unit) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    return `${!isNaN(na) ? numberToIndonesianWords(na) : a} sampai ${
      !isNaN(nb) ? numberToIndonesianWords(nb) : b
    } ${unit}`;
  });

  // 7. Convert standalone formatted thousands (e.g. "50.000") if any remain
  text = text.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (_match, digits: string) => {
    const val = parseInt(digits.replace(/\./g, ''), 10);
    if (isNaN(val)) return _match;
    return numberToIndonesianWords(val);
  });

  // 8. Expand common abbreviations & symbols for natural Indonesian flow
  text = text
    .replace(/\bs\/d\b/gi, 'sampai dengan')
    .replace(/\/\s*bulan\b/gi, ' per bulan')
    .replace(/\/\s*tahun\b/gi, ' per tahun')
    .replace(/\/\s*hari\b/gi, ' per hari')
    .replace(/\bdll\.?\b/gi, 'dan lain-lain')
    .replace(/\bdsb\.?\b/gi, 'dan sebagainya')
    .replace(/\byg\b/gi, 'yang')
    .replace(/\bUtk\b/gi, 'Untuk')
    .replace(/\bdgn\b/gi, 'dengan');

  // 9. Naturalize robotic interjections & colloquialisms
  text = text
    .replace(/he+i+-?\s*ya+!*/gi, 'Ayo,')
    .replace(/ye+a+y+!*/gi, 'Wah, asik!')
    .replace(/\byaa+\b/gi, 'ya')
    .replace(/\bnggak\b/gi, 'enggak')
    .replace(/\bgak\b/gi, 'enggak')
    .replace(/\bpasswordnya\b/gi, 'kata sandinya')
    .replace(/\bpassword\b/gi, 'kata sandi')
    .replace(/\blogin\b/gi, 'masuk')
    .replace(/\bcash\s*flow\b/gi, 'arus kas')
    .replace(/\boverspending\b/gi, 'pengeluaran berlebih')
    .replace(/\bnet\s*cash\s*flow\b/gi, 'arus kas bersih')
    .replace(/\(Net\)/gi, 'bersih');

  // 10. Brand & Fintech Acronym Phonetics (so TTS doesn't spell S-A-K-U-W-I-S-E or read AI as "ai")
  text = text
    .replace(/\bSAKUWISE\s+AI\b/gi, 'Sakuwais Ey-Ay')
    .replace(/\bSAKUWISE\b/gi, 'Sakuwais')
    .replace(/\bAI\b/g, 'Ey-Ay')
    .replace(/\bQRIS\b/gi, 'Kris')
    .replace(/\bBCA\b/g, 'B C A')
    .replace(/\bBRI\b/g, 'B R I')
    .replace(/\bBNI\b/g, 'B N I')
    .replace(/\bBSI\b/g, 'B S I')
    .replace(/\bOCR\b/g, 'O C R')
    .replace(/\bCSV\b/g, 'C S V')
    .replace(/\bPDF\b/g, 'P D F')
    .replace(/\bJSON\b/g, 'Jesen')
    .replace(/\bIDR\b/g, 'Rupiah');

  // 11. Clean numbered list prefixes & newlines into natural sentence pauses
  text = text
    .replace(/(?:^|\n)\s*(\d+)\.\s+/g, '. ')
    .replace(/\n+/g, '. ')
    .replace(/\s*:\s*/g, ', ')
    .replace(/\.{2,}/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*\./g, '$1')
    .trim();

  return text;
}

/**
 * Pre-generated Studio Human Indonesian Neural Voice (id_001) MP3 assets in /voices/*.mp3
 * Guarantees 0ms instant playback and 100% real human voice on localhost, Laragon, & Hostinger.
 */
const STUDIO_VOICE_ENTRIES: Array<[string, string]> = [
  ['Halo! Selamat datang di SAKUWISE AI.', '/voices/login_1.mp3'],
  ['Halo teman-teman! Selamat datang di SAKUWISE AI!', '/voices/login_1.mp3'],
  ['Halo! Selamat datang di SAKUWISE AI. Silakan masuk ke akunmu ya.', '/voices/login_mobile.mp3'],
  ['Aku asisten pintar keuanganmu, senang banget bisa bertemu kamu.', '/voices/login_2.mp3'],
  ['Sebentar ya, aku ambilkan formulir masuknya dulu.', '/voices/login_3.mp3'],
  ['Sebentar yaa, aku tarik formulirnya dulu!', '/voices/login_3.mp3'],
  ['Hop, ayo kita tarik perlahan ke tengah.', '/voices/login_4.mp3'],
  ['Heei-yaaa! Tarik perlahan ke tengah!', '/voices/login_4.mp3'],
  ['Nah, sudah siap. Silakan masuk ke akunmu ya.', '/voices/login_5.mp3'],
  ['Sudah saya tarik ya, silakan login!', '/voices/login_5.mp3'],
  ['Silakan ketik email kamu ya.', '/voices/login_email.mp3'],
  ['Tenang, aku tutup mata, nggak bakal ngintip kok.', '/voices/login_pass_hide.mp3'],
  ['Tenang, aku tutup mata, enggak bakal ngintip kok.', '/voices/login_pass_hide.mp3'],
  ['Wah, kata sandinya terlihat.', '/voices/login_pass_peek.mp3'],
  ['Wah, passwordnya terlihat!', '/voices/login_pass_peek.mp3'],
  ['Mata tertutup lagi, aman.', '/voices/login_pass_safe.mp3'],
  ['Ups, email dan kata sandinya wajib diisi dulu ya.', '/voices/login_err_empty.mp3'],
  ['Ups, email dan passwordnya wajib diisi dulu ya!', '/voices/login_err_empty.mp3'],
  ['Memverifikasi akun kamu, tunggu sebentar ya.', '/voices/login_verifying.mp3'],
  ['Hore, berhasil masuk! Selamat datang kembali.', '/voices/login_success.mp3'],
  ['Yeeeay, berhasil masuk! Selamat datang kembali!', '/voices/login_success.mp3'],
  ['Ups, email atau kata sandinya belum tepat nih, coba dicek lagi ya.', '/voices/login_err_auth.mp3'],
  ['Ups, email atau passwordnya salah nih, coba dicek lagi ya!', '/voices/login_err_auth.mp3'],
  ['Halo! Aku asisten pintar keuanganmu, senang bertemu denganmu!', '/voices/mascot_hello.mp3'],
  ['Halo teman baru! Yuk daftar dan mulai perjalanan finansialmu bareng aku.', '/voices/reg_welcome.mp3'],
  ['Halo teman baru! Ayo daftar dan mulai masa depan finansialmu bareng aku!', '/voices/reg_welcome.mp3'],
  ['Boleh tahu siapa nama lengkapmu?', '/voices/reg_name.mp3'],
  ['Ketik email aktifmu ya, biar akunmu tetap aman.', '/voices/reg_email.mp3'],
  ['Ketik email aktifmu ya, biar akunmu aman!', '/voices/reg_email.mp3'],
  ['Pastikan kata sandinya sama persis ya.', '/voices/reg_pass_same.mp3'],
  ['Ketik ulang kata sandi yang sama ya.', '/voices/reg_pass_retype.mp3'],
  ['Konfirmasi kata sandi terlihat.', '/voices/reg_pass_confirm_peek.mp3'],
  ['Nama lengkapnya diisi dulu ya.', '/voices/reg_err_name.mp3'],
  ['Emailnya jangan lupa diisi ya.', '/voices/reg_err_email.mp3'],
  ['Kata sandi harus minimal 6 karakter ya!', '/voices/reg_err_pass_len.mp3'],
  ['Kata sandi harus minimal enam karakter ya.', '/voices/reg_err_pass_len.mp3'],
  ['Konfirmasi kata sandi belum sama nih.', '/voices/reg_err_pass_match.mp3'],
  ['Centang persetujuan ketentuan layanan dulu ya.', '/voices/reg_err_terms.mp3'],
  ['Mendaftarkan akun barumu, tunggu sebentar ya.', '/voices/reg_submitting.mp3'],
  ['Yeeeay, akun kamu berhasil dibuat! Selamat bergabung di SAKUWISE AI!', '/voices/reg_success.mp3'],
  ['Wah, asik! Akun kamu berhasil dibuat! Selamat bergabung di Sakuwais!', '/voices/reg_success.mp3'],
  ['Ups, pendaftaran gagal. Coba periksa kembali ya.', '/voices/reg_err_fail.mp3'],
  ['Suara asisten berhasil diaktifkan.', '/voices/sound_on.mp3'],
  ['Menampilkan analisis kategori', '/voices/rep_cat.mp3'],
  ['Menampilkan evaluasi kinerja anggaran', '/voices/rep_budget.mp3'],
  ['Menampilkan ringkasan bulanan', '/voices/rep_monthly.mp3'],
  ['Membuka dokumen cetak PDF', '/voices/rep_pdf.mp3'],
  ['Mengunduh berkas CSV', '/voices/rep_csv.mp3'],
  ['Belum ada data laporan yang tersedia saat ini.', '/voices/rep_empty.mp3'],
];

function normalizeLookupKey(str: string): string {
  return humanizeIndonesianSpeech(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const STUDIO_VOICE_MAP = new Map<string, string>();
for (const [phrase, mp3Url] of STUDIO_VOICE_ENTRIES) {
  STUDIO_VOICE_MAP.set(normalizeLookupKey(phrase), mp3Url);
}

function splitIntoSpeechClauses(text: string, maxLen = 200): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const rawSentences = cleaned.match(/[^.!?;\n]+[.!?;\n]*/g) || [cleaned];
  const chunks: string[] = [];
  let current = '';

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= maxLen) {
        current = trimmed;
      } else {
        const words = trimmed.split(/\s+/);
        current = '';
        for (const w of words) {
          if ((current + ' ' + w).trim().length <= maxLen) {
            current = (current + ' ' + w).trim();
          } else {
            if (current) chunks.push(current);
            current = w;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

class SoundFX {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private speechGenerationId: number = 0;
  private currentAudio: HTMLAudioElement | null = null;
  private blockedAudio: HTMLAudioElement | null = null;
  private audioUnlocked: boolean = false;
  private isCurrentlySpeaking: boolean = false;
  private activeOnEndCallback: (() => void) | null = null;
  private speakingListeners: Set<(speaking: boolean) => void> = new Set();
  private sentenceTimer: ReturnType<typeof setTimeout> | null = null;

  // In-memory cache of Neural TTS Blob URLs for instant 0ms playback
  private audioBlobCache: Map<string, string> = new Map();
  private pendingPreloads: Map<string, Promise<string | null>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('sakuwise_sound_muted') === 'true';

      // Pre-populate cache with bundled Studio Human Voice MP3 URLs
      STUDIO_VOICE_MAP.forEach((mp3Path, normKey) => {
        this.audioBlobCache.set(normKey, mp3Path);
      });

      // Global gesture listener to unlock HTML5 Audio & Web Audio API immediately
      const unlockHandler = () => {
        this.unlockAudio();
      };
      window.addEventListener('pointerdown', unlockHandler, { capture: true, passive: true });
      window.addEventListener('mousedown', unlockHandler, { capture: true, passive: true });
      window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
      window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
      window.addEventListener('click', unlockHandler, { capture: true, passive: true });

      if ('speechSynthesis' in window) {
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  public isAudioUnlocked(): boolean {
    return this.audioUnlocked;
  }

  public unlockAudio() {
    this.audioUnlocked = true;
    this.initCtx();

    if (this.blockedAudio && !this.muted) {
      const pending = this.blockedAudio;
      this.blockedAudio = null;
      this.currentAudio = pending;
      pending.play().catch(() => {});
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        this.voices = available;
      }
    }
  }

  private setSpeakingState(speaking: boolean) {
    this.isCurrentlySpeaking = speaking;
    this.speakingListeners.forEach((listener) => {
      try {
        listener(speaking);
      } catch (_) {}
    });
  }

  public getIsSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public onSpeakingChange(listener: (speaking: boolean) => void): () => void {
    this.speakingListeners.add(listener);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  /**
   * Immediately stops any active speech (both Studio Neural HTML5 Audio & Web Speech API)
   * and triggers any pending onEnd callback cleanly so UI states never get stuck or collide.
   */
  public stopSpeaking() {
    this.speechGenerationId++;
    this.blockedAudio = null;

    if (this.sentenceTimer) {
      clearTimeout(this.sentenceTimer);
      this.sentenceTimer = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    this.setSpeakingState(false);

    if (this.activeOnEndCallback) {
      const cb = this.activeOnEndCallback;
      this.activeOnEndCallback = null;
      try {
        cb();
      } catch (_) {}
    }
  }

  /**
   * Selects the best available Indonesian fallback voice in Web Speech API
   * (only used if offline and not in pre-bundled /voices/*.mp3).
   */
  private getBestFallbackIndonesianVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    if (this.voices.length === 0) return null;

    const onlineNeural = this.voices.find((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        (lang === 'id-id' || lang.startsWith('id')) &&
        (name.includes('natural') || name.includes('online') || name.includes('gadis') || name.includes('ardi'))
      );
    });
    if (onlineNeural) return onlineNeural;

    const googleOrAppleId = this.voices.find((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        (lang === 'id-id' || lang.startsWith('id')) &&
        (name.includes('google') || name.includes('damayanti') || name.includes('indonesia')) &&
        !name.includes('andika')
      );
    });
    if (googleOrAppleId) return googleOrAppleId;

    const anyId = this.voices.find(
      (v) => v.lang.toLowerCase() === 'id-id' || v.lang.toLowerCase().startsWith('id')
    );
    return anyId || null;
  }

  /**
   * Prefetches Studio Human Voice MP3 files so mascot/UI dialogue plays with 0ms latency.
   */
  public preloadPhrases(phrases: string[]) {
    if (typeof window === 'undefined') return;

    for (const raw of phrases) {
      const normKey = normalizeLookupKey(raw);
      const bundledPath = STUDIO_VOICE_MAP.get(normKey);
      if (bundledPath) {
        // Warm up browser HTTP cache for bundled static MP3
        fetch(bundledPath).catch(() => {});
        continue;
      }

      const humanized = humanizeIndonesianSpeech(raw);
      if (!humanized || this.audioBlobCache.has(normKey) || this.pendingPreloads.has(normKey)) {
        continue;
      }
      this.fetchNeuralAudioBlobUrl(humanized).catch(() => {});
    }
  }

  /**
   * Resolves a single clause/sentence into a Studio Human Neural Voice (id_001) MP3 URL.
   * Priority:
   * 1. Pre-bundled static Studio Human Voice MP3 in /voices/*.mp3 (0ms instant, works offline & online)
   * 2. Direct browser synthesis via Studio Human Indonesian Neural API (id_001, CORS enabled)
   * 3. Backend /api/v1/tts stream (Node.js & Hostinger PHP)
   */
  private async fetchNeuralAudioBlobUrl(clauseText: string): Promise<string | null> {
    const normKey = normalizeLookupKey(clauseText);
    const bundled = STUDIO_VOICE_MAP.get(normKey) || this.audioBlobCache.get(normKey);
    if (bundled) return bundled;

    const existingPromise = this.pendingPreloads.get(normKey);
    if (existingPromise) return existingPromise;

    const promise = (async (): Promise<string | null> => {
      // 1. Direct Studio Human Indonesian Neural Voice (id_001)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch('https://ottsy.weilbyte.dev/api/generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clauseText,
            voice: 'id_001',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            const binaryStr = window.atob(json.data);
            const len = binaryStr.length;
            if (len > 200) {
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/mpeg' });
              const blobUrl = URL.createObjectURL(blob);
              this.audioBlobCache.set(normKey, blobUrl);
              return blobUrl;
            }
          }
        }
      } catch (_) {}

      // 2. Backend /api/v1/tts endpoint (Node.js or Hostinger PHP)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);
        const url = `${BASE_URL}/tts?text=${encodeURIComponent(clauseText)}&lang=id`;

        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('audio')) {
            const blob = await res.blob();
            if (blob.size > 200) {
              const blobUrl = URL.createObjectURL(blob);
              this.audioBlobCache.set(normKey, blobUrl);
              return blobUrl;
            }
          }
        }
      } catch (_) {}

      return null;
    })();

    this.pendingPreloads.set(normKey, promise);
    try {
      return await promise;
    } finally {
      this.pendingPreloads.delete(normKey);
    }
  }

  /**
   * Speaks text using the Studio Human Indonesian Neural Voice.
   * Supports both (text, pitch, rate) and (text, { pitch, rate, onEnd, onError }) signatures.
   */
  public speak(text: string, pitchOrOptions?: number | SpeakOptions, rateArg?: number) {
    // Always stop any previous speech first so voices never overlap ("biar ga bentrok")
    this.stopSpeaking();

    let onEnd: (() => void) | undefined;
    let requestedRate = 1.0;

    if (typeof pitchOrOptions === 'object' && pitchOrOptions !== null) {
      onEnd = pitchOrOptions.onEnd;
      if (pitchOrOptions.rate !== undefined) requestedRate = pitchOrOptions.rate;
    } else if (typeof rateArg === 'number') {
      requestedRate = rateArg;
    }

    if (this.muted || typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    // Check if the raw text matches a pre-bundled Studio Human Voice MP3 directly
    const rawNormKey = normalizeLookupKey(text);
    const bundledDirectUrl = STUDIO_VOICE_MAP.get(rawNormKey);

    const humanized = humanizeIndonesianSpeech(text);
    if (!humanized && !bundledDirectUrl) {
      if (onEnd) onEnd();
      return;
    }

    const genId = ++this.speechGenerationId;
    this.activeOnEndCallback = onEnd || null;
    this.setSpeakingState(true);

    const naturalRate = Math.max(0.95, Math.min(1.08, requestedRate || 1.0));

    // Play Studio Human Neural Voice (pre-bundled /voices/*.mp3 or live id_001 neural clauses)
    this.playStudioHumanSpeech(bundledDirectUrl ? [text] : splitIntoSpeechClauses(humanized, 200), genId, naturalRate).then(
      (playedOrQueued) => {
        if (genId !== this.speechGenerationId) return;
        if (!playedOrQueued) {
          // Only if completely offline and not a bundled phrase: fallback to Web Speech
          const fallbackVoice = this.getBestFallbackIndonesianVoice();
          this.speakWithWebSpeech(humanized, genId, fallbackVoice, naturalRate);
        }
      }
    );
  }

  private async playStudioHumanSpeech(
    clauses: string[],
    genId: number,
    rate: number
  ): Promise<boolean> {
    if (clauses.length === 0) return false;

    // Prefetch all clauses in parallel so multi-sentence AI responses play gaplessly
    const urlPromises = clauses.map((clause) => {
      const normKey = normalizeLookupKey(clause);
      const bundled = STUDIO_VOICE_MAP.get(normKey);
      if (bundled) return Promise.resolve(bundled);
      return this.fetchNeuralAudioBlobUrl(clause);
    });

    for (let i = 0; i < urlPromises.length; i++) {
      if (genId !== this.speechGenerationId || this.muted) return true;

      const audioUrl = await urlPromises[i];
      if (genId !== this.speechGenerationId || this.muted) return true;
      if (!audioUrl) return false;

      const finishedClause = await new Promise<boolean>((resolve) => {
        if (genId !== this.speechGenerationId || this.muted) {
          resolve(true);
          return;
        }

        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        if ('preservesPitch' in audio) {
          (audio as any).preservesPitch = true;
        }
        audio.playbackRate = Math.max(0.96, Math.min(1.05, rate));
        audio.volume = 1.0;

        this.currentAudio = audio;

        audio.onended = () => {
          if (genId !== this.speechGenerationId) {
            resolve(true);
            return;
          }
          this.currentAudio = null;
          resolve(true);
        };

        audio.onerror = () => {
          if (genId !== this.speechGenerationId) {
            resolve(true);
            return;
          }
          this.currentAudio = null;
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.audioUnlocked = true;
            })
            .catch((err: any) => {
              // If browser blocked autoplay because user hasn't clicked yet (NotAllowedError),
              // NEVER downgrade to robotic speechSynthesis! Queue it for first click/touch.
              if (err && (err.name === 'NotAllowedError' || String(err.message).includes('interact'))) {
                this.blockedAudio = audio;
                this.currentAudio = null;
              } else {
                this.currentAudio = null;
                resolve(false);
              }
            });
        }
      });

      if (!finishedClause) return false;
    }

    if (genId === this.speechGenerationId) {
      this.currentAudio = null;
      this.setSpeakingState(false);
      if (this.activeOnEndCallback) {
        const cb = this.activeOnEndCallback;
        this.activeOnEndCallback = null;
        cb();
      }
    }

    return true;
  }

  /**
   * Speaks text using Web Speech API split into natural sentence chunks with micro-breathing pauses
   * and zero pitch distortion (pitch = 1.0).
   */
  private speakWithWebSpeech(
    humanizedText: string,
    genId: number,
    voice: SpeechSynthesisVoice | null,
    rate: number
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setSpeakingState(false);
      if (this.activeOnEndCallback) {
        const cb = this.activeOnEndCallback;
        this.activeOnEndCallback = null;
        cb();
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Split into natural sentences so intonation is expressive and Chrome never times out
      const sentences =
        humanizedText
          .match(/[^.!?]+[.!?]*/g)
          ?.map((s) => s.trim())
          .filter(Boolean) || [humanizedText];

      let index = 0;

      const speakNextSentence = () => {
        if (genId !== this.speechGenerationId || this.muted) return;

        if (index >= sentences.length) {
          this.setSpeakingState(false);
          if (this.activeOnEndCallback) {
            const cb = this.activeOnEndCallback;
            this.activeOnEndCallback = null;
            cb();
          }
          return;
        }

        const sentence = sentences[index++];
        const utterance = new SpeechSynthesisUtterance(sentence);
        // CRITICAL: pitch = 1.0 prevents metallic phase-vocoder / chipmunk distortion!
        utterance.pitch = 1.0;
        utterance.rate = Math.max(0.95, Math.min(1.05, rate));
        utterance.volume = 1.0;
        utterance.lang = 'id-ID';

        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = () => {
          if (genId !== this.speechGenerationId) return;
          if (index < sentences.length) {
            // Natural human micro-breathing pause between sentences (130ms)
            this.sentenceTimer = setTimeout(speakNextSentence, 130);
          } else {
            this.setSpeakingState(false);
            if (this.activeOnEndCallback) {
              const cb = this.activeOnEndCallback;
              this.activeOnEndCallback = null;
              cb();
            }
          }
        };

        utterance.onerror = () => {
          if (genId !== this.speechGenerationId) return;
          this.setSpeakingState(false);
          if (this.activeOnEndCallback) {
            const cb = this.activeOnEndCallback;
            this.activeOnEndCallback = null;
            cb();
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextSentence();
    } catch (_) {
      this.setSpeakingState(false);
      if (this.activeOnEndCallback) {
        const cb = this.activeOnEndCallback;
        this.activeOnEndCallback = null;
        cb();
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('sakuwise_sound_muted', this.muted ? 'true' : 'false');
    if (!this.muted) {
      this.playCartoonPop();
      this.speak('Suara asisten berhasil diaktifkan.');
    } else {
      this.stopSpeaking();
    }
    return this.muted;
  }

  /**
   * Gentle 3-note melodic chime (softened so it never clashes with speech)
   */
  public playCartoonChime() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 warm triad

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteStart = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.05, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.18);
      });
    } catch (_) {}
  }

  /**
   * Warm subtle greeting melody
   */
  public playCartoonGreeting() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [392.0, 523.25, 659.25];

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteStart = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.045, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.18);
      });
    } catch (_) {}
  }

  /**
   * Soft bubble pop
   */
  public playCartoonPop() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_) {}
  }

  /**
   * Soft spring transition effect
   */
  public playCartoonBoing() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) {}
  }

  /**
   * Subtle pulling movement sound
   */
  public playCartoonEffort() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.22);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_) {}
  }

  /**
   * Celebratory chord fanfare
   */
  public playCartoonTada() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const isFinal = idx === notes.length - 1;
        const noteStart = now + idx * 0.08;
        const noteDur = isFinal ? 0.45 : 0.16;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(isFinal ? 0.09 : 0.06, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDur);
      });
    } catch (_) {}
  }

  /**
   * Futuristic cyber intro chime for the app loading screen
   */
  public playCyberChime() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 ethereal major

      chords.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteStart = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, noteStart + 0.45);

        gain.gain.setValueAtTime(0.07, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.55);
      });
    } catch (_) {}
  }

  public playWoosh() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (_) {}
  }

  public playDock() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  public playChirp(freq = 680, duration = 0.07) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  public playPeek() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.1);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  }

  public playSuccess() {
    if (this.muted) return;
    this.playCartoonTada();
  }
}

export const sound = new SoundFX();
