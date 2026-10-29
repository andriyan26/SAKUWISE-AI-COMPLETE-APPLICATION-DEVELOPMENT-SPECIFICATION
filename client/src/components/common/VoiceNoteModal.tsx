import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Sparkles, X, Check, Volume2, AlertCircle, RefreshCw } from 'lucide-react';
import { voiceService } from '../../lib/voice-service.js';
import { sound } from '../../lib/sound.js';
import {
  parseVoiceTransaction,
  ParsedVoiceTransaction,
} from '../../lib/voice-parser.js';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParsedTransaction: (parsed: ParsedVoiceTransaction) => void;
  availableCategories?: any[];
  title?: string;
  subtitle?: string;
  promptExamples?: string[];
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  isOpen,
  onClose,
  onParsedTransaction,
  availableCategories = [],
  title = 'Voice Note AI — Catat Otomatis',
  subtitle = 'Bicara secara alami, AI akan mendeteksi nominal, kategori, metode, & merchant secara otomatis.',
  promptExamples = [
    'Beli bensin di Pertamina 50 ribu transfer bank',
    'Makan siang di Solaria 85 ribu bayar tunai',
    'Gaji bulanan 5 juta masuk rekening BCA',
    'Beli kopi Starbucks 60 ribu bayar pakai QRIS',
  ],
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewParsed, setPreviewParsed] = useState<ParsedVoiceTransaction | null>(null);

  // Audio wave animation simulation
  const [waveHeights, setWaveHeights] = useState<number[]>([20, 40, 60, 30, 70, 50, 30]);

  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setWaveHeights([
          Math.floor(Math.random() * 60) + 20,
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 95) + 30,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 90) + 30,
          Math.floor(Math.random() * 60) + 20,
          Math.floor(Math.random() * 40) + 15,
        ]);
      }, 100);
    } else {
      setWaveHeights([15, 20, 25, 20, 25, 20, 15]);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimText('');
      setErrorMessage(null);
      setPreviewParsed(null);
      startRecording();
    } else {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = () => {
    setErrorMessage(null);
    sound.playChirp(800, 0.08);

    const started = voiceService.startListening({
      lang: 'id-ID',
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimText('');
          // Real-time parsing preview
          const parsed = parseVoiceTransaction(text, availableCategories);
          setPreviewParsed(parsed);
        } else {
          setInterimText(text);
          const parsed = parseVoiceTransaction(text, availableCategories);
          setPreviewParsed(parsed);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started && !errorMessage) {
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const handleApply = () => {
    const textToParse = transcript || interimText;
    if (!textToParse.trim()) {
      setErrorMessage('Belum ada suara yang terekam. Silakan tekan mikrofon dan coba bicara.');
      return;
    }

    const result = parseVoiceTransaction(textToParse, availableCategories);
    sound.playSuccess();
    onParsedTransaction(result);
    onClose();
  };

  const handleUseExample = (example: string) => {
    setTranscript(example);
    setInterimText('');
    const parsed = parseVoiceTransaction(example, availableCategories);
    setPreviewParsed(parsed);
    sound.playChirp(700, 0.05);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg my-auto bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={() => {
            stopRecording();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shadow-glow-violet">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {subtitle}
        </p>

        {/* Pulsating Visualizer & Mic Button Centerpiece */}
        <div className="flex flex-col items-center justify-center py-6 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 mb-6 relative overflow-hidden">
          {/* Animated Glow background */}
          <div
            className={`absolute w-36 h-36 rounded-full bg-brand-violet/20 blur-2xl transition-all duration-300 ${
              isListening ? 'scale-125 opacity-100 animate-pulse' : 'scale-75 opacity-30'
            }`}
          />

          {/* Sound Wave Bars */}
          <div className="flex items-center justify-center gap-1.5 h-14 mb-4 z-10">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  isListening
                    ? 'bg-gradient-to-t from-brand-violet to-brand-teal shadow-glow-violet'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Main Toggle Mic Button */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopRecording();
                sound.playChirp(400, 0.08);
              } else {
                startRecording();
              }
            }}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 z-10 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/50 animate-pulse ring-4 ring-rose-500/30'
                : 'bg-gradient-to-tr from-brand-violet to-brand-teal hover:opacity-95 shadow-glow-violet ring-4 ring-brand-violet/20 hover:scale-105'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 z-10 flex items-center gap-1.5">
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Mendengarkan... Silakan bicara sekarang</span>
              </>
            ) : (
              <span>Ketuk mikrofon untuk mulai bicara</span>
            )}
          </span>
        </div>

        {/* Live Speech Recognition Transcript Box */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Teks Suara Terdeteksi
          </label>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[72px] text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed shadow-inner">
            {transcript || interimText ? (
              <p className="font-medium">
                {transcript}
                {interimText && <span className="opacity-50 italic"> {interimText}</span>}
              </p>
            ) : (
              <p className="text-slate-400 italic">
                {isListening
                  ? 'Suaramu akan muncul di sini secara langsung...'
                  : 'Belum ada suara. Tekan mikrofon di atas lalu bicaralah.'}
              </p>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Parsed Fields Preview Card */}
        {previewParsed && (previewParsed.amount || previewParsed.merchant || previewParsed.title) && (
          <div className="p-3.5 mb-4 rounded-2xl bg-gradient-to-r from-brand-violet/10 via-brand-teal/10 to-indigo-500/10 border border-brand-violet/30 animate-fadeIn text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-brand-violet dark:text-brand-cyan mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hasil Analisa Otomatis AI:</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet text-white">
                {previewParsed.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400">Nominal:</span>{' '}
                <strong className="text-emerald-500 dark:text-emerald-400 font-bold">
                  {previewParsed.amount
                    ? `Rp ${previewParsed.amount.toLocaleString('id-ID')}`
                    : 'Belum terdeteksi'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Kategori:</span>{' '}
                <strong>{previewParsed.categoryName || 'Otomatis'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Metode:</span>{' '}
                <strong>{previewParsed.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-slate-400">Merchant:</span>{' '}
                <strong>{previewParsed.merchant || '-'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Suggestions Pills */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Ide Kalimat Cepat (Ketuk untuk coba):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {promptExamples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleUseExample(ex)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-left"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript && !interimText}
            className="flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Masukkan ke Form Sekarang</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
