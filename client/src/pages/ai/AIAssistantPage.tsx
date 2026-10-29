import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../lib/api-client.js';
import { sound } from '../../lib/sound.js';
import { voiceService } from '../../lib/voice-service.js';
import { getSafeAvatarUrl, handleAvatarError } from '../../lib/avatar.js';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  CheckCircle2,
  BrainCircuit,
  MessageSquare,
  ArrowRight,
  X,
  History,
  RefreshCw,
  Coins,
  TrendingUp,
  ShieldCheck,
  Target,
  PieChart,
  ChevronRight,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FormattedMessageProps {
  content: string;
}

// Komponen perender markdown ringan untuk pesan AI
const FormattedContent: React.FC<FormattedMessageProps> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const itemText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-violet dark:bg-brand-cyan shrink-0 mt-2" />
              <span className="flex-1 text-slate-700 dark:text-slate-200">
                {renderBold(itemText)}
              </span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-brand-violet/10 text-brand-violet dark:bg-brand-violet/20 dark:text-brand-cyan shrink-0">
                {numMatch[1]}
              </span>
              <span className="flex-1 text-slate-700 dark:text-slate-200">
                {renderBold(numMatch[2])}
              </span>
            </div>
          );
        }

        // Heading with emoji or standard heading
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('📊') || trimmed.startsWith('🏷️') || trimmed.startsWith('💡') || trimmed.startsWith('🎯')) {
          return (
            <p key={idx} className="font-bold text-slate-900 dark:text-white pt-1 flex items-center gap-1.5">
              {renderBold(trimmed.replace(/^#+\s*/, ''))}
            </p>
          );
        }

        return (
          <p key={idx} className="text-slate-700 dark:text-slate-200">
            {renderBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper untuk format teks bold (**teks**)
const renderBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      // Highlight jika berformat Rupiah
      const isRp = boldText.includes('Rp ') || boldText.includes('%');
      return (
        <strong
          key={i}
          className={`font-bold ${
            isRp
              ? 'text-brand-violet dark:text-brand-cyan font-mono'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {boldText}
        </strong>
      );
    }
    return part;
  });
};

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mobile sidebar drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Memories modal state
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Clean up any active speech or microphone listening when leaving the page
  useEffect(() => {
    return () => {
      sound.stopSpeaking();
      voiceService.stopListening();
    };
  }, []);

  // Featured suggestion prompt cards
  const suggestionCards = [
    {
      title: 'Analisis Pengeluaran',
      desc: 'Ringkasan arus kas, saldo bersih & tingkat tabungan bulan ini.',
      icon: TrendingUp,
      prompt: 'Analisis pengeluaranku bulan ini.',
      gradient: 'from-blue-500/15 via-indigo-500/10 to-transparent border-blue-500/25 text-blue-500 dark:text-blue-400',
    },
    {
      title: 'Pos Paling Boros',
      desc: 'Kategori apa yang paling banyak menghabiskan uangmu?',
      icon: PieChart,
      prompt: 'Kategori apa yang paling banyak menghabiskan uangku?',
      gradient: 'from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/25 text-amber-500 dark:text-amber-400',
    },
    {
      title: 'Rekomendasi Anggaran',
      desc: 'Buatkan draf batas anggaran cerdas untuk pos belanja teratas.',
      icon: Coins,
      prompt: 'Bantu aku membuat anggaran bulanan.',
      gradient: 'from-purple-500/15 via-brand-violet/10 to-transparent border-brand-violet/25 text-brand-violet dark:text-brand-cyan',
    },
    {
      title: 'Target Dana Darurat',
      desc: 'Hitung estimasi & buat rencana tabungan likuid mandiri.',
      icon: Target,
      prompt: 'Buatkan rencana menabung untuk dana darurat.',
      gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/25 text-emerald-500 dark:text-emerald-400',
    },
  ];

  // Quick horizontal prompt pills
  const quickPills = [
    '📊 Analisis Bulan Ini',
    '🏷️ 3 Pos Terbesar',
    '💡 Buat Anggaran',
    '🎯 Rencana Dana Darurat',
    '⚡ Evaluasi Pola Belanja',
  ];

  const fetchConversations = async () => {
    try {
      const res = await api.get('/ai/conversations');
      if (res.success && res.data) {
        setConversations(res.data);
        if (!currentConversationId && res.data.length > 0) {
          loadConversation(res.data[0].id);
        }
      }
    } catch (_) {}
  };

  const loadConversation = async (id: string) => {
    setCurrentConversationId(id);
    setIsMobileDrawerOpen(false);
    try {
      const res = await api.get(`/ai/conversations/${id}`);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch (_) {}
  };

  const fetchMemories = async () => {
    try {
      const res = await api.get('/ai/memories');
      if (res.success) setMemories(res.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchConversations();
    fetchMemories();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleStartNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsMobileDrawerOpen(false);
    sound.playChirp(700, 0.08);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isThinking) return;

    sound.playChirp(600, 0.05);
    setInputValue('');

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsThinking(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        conversationId: currentConversationId,
      });

      if (res.success && res.data) {
        sound.playChirp(800, 0.08);
        if (!currentConversationId && res.data.conversationId) {
          setCurrentConversationId(res.data.conversationId);
          fetchConversations();
        }

        const assistantMsg = {
          id: res.data.messageId || `msg-${Date.now()}`,
          role: 'assistant',
          content: res.data.content,
          toolMetadataJson: JSON.stringify({
            thoughtProcess: res.data.thoughtProcess,
            toolsUsed: res.data.toolsUsed,
            actionDraft: res.data.actionDraft,
          }),
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        fetchMemories();
      } else {
        throw new Error(res.message || 'Server gagal memproses jawaban');
      }
    } catch (err: any) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Maaf, terjadi kendala saat memproses jawaban: ${err.message || 'Server error'}. Silakan coba kembali.`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmAction = async (actionDraft: any) => {
    try {
      const res = await api.post('/ai/actions/confirm', {
        actionType: actionDraft.actionType,
        payload: actionDraft.payload,
      });

      if (res.success) {
        sound.playSuccess();
        setToast({ type: 'success', message: res.message || 'Aksi rekomendasi AI berhasil diterapkan!' });
        handleSendMessage('Saya telah mengonfirmasi aksi tersebut. Terima kasih!');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menerapkan aksi.' });
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (id: string, type: 'like' | 'dislike') => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: true }));
    sound.playChirp(type === 'like' ? 900 : 400, 0.06);
    try {
      await api.post('/ai/feedback', {
        messageId: id,
        rating: type === 'like' ? 5 : 1,
      });
      setToast({
        type: 'success',
        message: type === 'like' ? 'Terima kasih atas penilaian positifmu! 🙏' : 'Terima kasih atas masukanmu, kami terus tingkatkan akurasi AI.',
      });
    } catch (_) {}
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${id}`);
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      fetchConversations();
    } catch (_) {}
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.delete(`/ai/memories/${id}`);
      fetchMemories();
      setToast({ type: 'success', message: 'Memori AI berhasil dihapus.' });
    } catch (_) {}
  };

  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      voiceService.stopListening();
      setIsVoiceListening(false);
      sound.playChirp(400, 0.08);
      return;
    }

    // Stop any AI message currently being spoken so it doesn't bleed into the mic
    sound.stopSpeaking();
    setSpeakingMsgId(null);

    sound.playChirp(750, 0.08);
    const started = voiceService.startListening({
      lang: 'id-ID',
      continuous: true,
      interimResults: true,
      onStart: () => setIsVoiceListening(true),
      onResult: (text) => {
        setInputValue(text);
      },
      onError: (err) => {
        setIsVoiceListening(false);
        setToast({ type: 'error', message: err });
      },
      onEnd: () => setIsVoiceListening(false),
    });

    if (!started) {
      setIsVoiceListening(false);
    }
  };

  const handleSpeakMessage = (content: string, id: string) => {
    if (speakingMsgId === id) {
      sound.stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    // Stop microphone if user was recording while clicking speak
    if (isVoiceListening) {
      voiceService.stopListening();
      setIsVoiceListening(false);
    }

    setSpeakingMsgId(id);
    sound.speak(content, {
      onEnd: () => {
        setSpeakingMsgId((prev) => (prev === id ? null : prev));
      },
      onError: () => {
        setSpeakingMsgId((prev) => (prev === id ? null : prev));
      },
    });
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 select-none">
      {/* ============================================================
          DESKTOP LEFT SIDEBAR: Sessions & AI Memory
          ============================================================ */}
      <div className="hidden md:flex w-72 bg-white/95 dark:bg-[#151D30]/95 backdrop-blur-xl border border-slate-200 dark:border-[#293449] rounded-3xl p-4 flex-col justify-between shrink-0 shadow-lg transition-colors duration-200">
        <div className="flex-1 flex flex-col min-h-0">
          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Percakapan Baru</span>
          </button>

          {/* Conversation Sessions List Header */}
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 px-2">
            <span>Riwayat Sesi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
              {conversations.length}
            </span>
          </div>

          {/* Scrollable Conversation Sessions */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {conversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>Belum ada riwayat sesi.</p>
                <p className="text-[10px] mt-1 text-slate-400">Mulai kirim pertanyaan pertamamu!</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = currentConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`p-3 rounded-2xl text-xs cursor-pointer transition-all flex items-center justify-between group border ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-violet/15 to-brand-teal/10 dark:from-brand-violet/25 dark:to-brand-teal/15 border-brand-violet/40 text-brand-violet dark:text-white font-bold shadow-sm'
                        : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-brand-violet text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{c.title || 'Percakapan Keuangan'}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {c._count?.messages ? (
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {c._count.messages}
                        </span>
                      ) : null}
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        title="Hapus sesi"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom AI Memory Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#293449] shrink-0">
          <button
            onClick={() => setIsMemoryOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-brand-teal" />
              <span>Memori Cerdas AI</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet dark:text-brand-cyan font-bold">
              {memories.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          MAIN CONVERSATION WINDOW (Fully Responsive Desktop & Mobile)
          ============================================================ */}
      <div className="flex-1 bg-white/95 dark:bg-[#151D30]/95 backdrop-blur-xl border border-slate-200 dark:border-[#293449] rounded-3xl flex flex-col justify-between overflow-hidden shadow-lg transition-colors duration-200 min-w-0">
        {/* Chat Top Header */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-[#293449] flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* AI Avatar with status pulse */}
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-violet via-purple-600 to-brand-teal flex items-center justify-center shadow-glow-violet text-white shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#151D30] rounded-full animate-pulse" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  SAKUWISE AI Assistant
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet dark:bg-brand-violet/25 dark:text-brand-cyan font-bold border border-brand-violet/30">
                  <ShieldCheck className="w-3 h-3" />
                  Agentic Financial Core
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Analisis keuangan presisi dengan kalkulasi database MySQL real-time
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile History Drawer Toggle */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <History className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan" />
              <span>Sesi</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-brand-violet text-white">
                {conversations.length}
              </span>
            </button>

            {/* Quick New Chat Button */}
            <button
              onClick={handleStartNewChat}
              title="Mulai Sesi Baru"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================
            MESSAGES STREAM / EMPTY STATE
            ============================================================ */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 min-h-0">
          {messages.length === 0 ? (
            /* EMPTY STATE: Welcoming Hero & Interactive Question Cards */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6 px-2">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-violet via-purple-600 to-brand-teal text-white flex items-center justify-center shadow-glow-violet animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-brand-violet to-brand-teal rounded-full blur-xl opacity-30 -z-10 animate-pulse" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Halo, {user?.name || 'Andrian'}! 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md leading-relaxed">
                Aku asisten keuangan pribadimu. Tanyakan apa pun tentang analisis arus kas, evaluasi pengeluaran, rekomendasi anggaran, atau rencana menabungmu.
              </p>

              {/* Categorized Prompt Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6 text-left">
                {suggestionCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br ${card.gradient} border hover:border-brand-violet hover:scale-[1.01] active:scale-[0.99] transition-all group relative overflow-hidden`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {card.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                        {card.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGE LIST */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              let metadata = null;
              try {
                if (msg.toolMetadataJson) {
                  metadata = typeof msg.toolMetadataJson === 'string'
                    ? JSON.parse(msg.toolMetadataJson)
                    : msg.toolMetadataJson;
                }
              } catch (_) {}

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                >
                  {/* Bot Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shrink-0 shadow-md self-start mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[90%] sm:max-w-2xl space-y-2">
                    {/* Agentic Thought Process Accordion */}
                    {!isUser && metadata?.thoughtProcess && metadata.thoughtProcess.length > 0 && (
                      <details className="group p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 text-[11px] cursor-pointer transition-all">
                        <summary className="font-bold text-brand-violet dark:text-brand-cyan flex items-center justify-between list-none">
                          <span className="flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                            <span>Tahapan Berpikir Agen AI ({metadata.thoughtProcess.length} langkah terverifikasi)</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="mt-2.5 space-y-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-300 pl-2.5 border-l-2 border-brand-violet/50">
                          {metadata.thoughtProcess.map((step: string, i: number) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="text-brand-teal font-bold shrink-0">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-3xl leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-brand-violet via-purple-600 to-indigo-600 text-white rounded-tr-none font-medium text-xs sm:text-sm'
                          : 'bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <FormattedContent content={msg.content} />
                      )}
                    </div>

                    {/* Action Confirmation Widget Card */}
                    {!isUser && metadata?.actionDraft && (
                      <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-violet/10 via-brand-teal/10 to-indigo-500/10 dark:from-brand-violet/20 dark:via-brand-teal/15 dark:to-indigo-500/15 border-2 border-brand-violet/40 shadow-glow-violet animate-fade-in-up">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              {metadata.actionDraft.title}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-violet text-white">
                            Rekomendasi
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                          {metadata.actionDraft.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmAction(metadata.actionDraft)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal hover:opacity-95 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terapkan Rekomendasi Sekarang</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message Action Toolbar */}
                    {!isUser && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-1 pt-0.5">
                        <button
                          onClick={() => handleSpeakMessage(msg.content, msg.id)}
                          title={speakingMsgId === msg.id ? 'Hentikan Suara' : 'Dengarkan Jawaban AI'}
                          className={`hover:text-brand-violet dark:hover:text-brand-cyan flex items-center gap-1 transition-colors ${
                            speakingMsgId === msg.id ? 'text-brand-violet dark:text-brand-cyan font-bold' : ''
                          }`}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                              <span className="text-rose-500">Berhenti</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Dengarkan</span>
                            </>
                          )}
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-700 dark:hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleFeedback(msg.id, 'like')}
                          title="Jawaban sangat membantu"
                          className={`hover:text-emerald-500 flex items-center gap-1 transition-colors ${
                            feedbackGiven[msg.id] ? 'text-emerald-500 font-bold' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Bagus</span>
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          title="Kurang akurat"
                          className="hover:text-rose-500 flex items-center gap-1 transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="relative self-start mt-1">
                      <img
                        src={getSafeAvatarUrl(user?.avatarUrl, user?.name)}
                        alt={user?.name || 'User'}
                        onError={(e) => handleAvatarError(e, user?.name)}
                        className="w-8 h-8 rounded-xl object-cover border border-brand-violet/50 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* AI Thinking Animation State */}
          {isThinking && (
            <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-violet animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  SAKUWISE AI sedang menganalisis data keuanganmu...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================
            BOTTOM INPUT & QUICK PROMPT PILLS
            ============================================================ */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#293449] bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          {/* Quick Prompt Pills Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5">
            {quickPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(pill.replace(/^[^\w\s]+\s*/, ''))}
                disabled={isThinking}
                className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-violet hover:text-brand-violet dark:hover:text-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 shadow-xs disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Form Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isVoiceListening) {
                voiceService.stopListening();
                setIsVoiceListening(false);
              }
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isVoiceListening
                    ? 'Sedang mendengarkan... Silakan bicara sekarang...'
                    : 'Tanyakan analisis keuangan, evaluasi pos belanja, atau rekomendasi anggaran...'
                }
                className={`w-full pl-4 pr-10 sm:pr-24 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none shadow-inner transition-all ${
                  isVoiceListening
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-brand-violet focus:ring-1 focus:ring-brand-violet'
                }`}
              />
              {isVoiceListening && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="hidden sm:inline">Mendengarkan...</span>
                </span>
              )}
            </div>

            {/* Voice Note Input Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isVoiceListening ? 'Hentikan Rekam Suara' : 'Bicara dengan AI (Voice Note)'}
              className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                isVoiceListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 animate-pulse ring-4 ring-rose-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-violet dark:text-brand-cyan hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-brand-violet via-purple-600 to-brand-teal text-white shadow-glow-violet hover:opacity-95 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================
          MOBILE SLIDE-OVER DRAWER (For Sessions & Memory on Phones)
          ============================================================ */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#151D30] border-r border-slate-200 dark:border-[#293449] p-4 flex flex-col justify-between shadow-2xl z-10 animate-slide-right">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-violet flex items-center justify-center text-white">
                    <History className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Riwayat Sesi
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* New Chat in Mobile Drawer */}
              <button
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet flex items-center justify-center gap-2 mb-3"
              >
                <Plus className="w-4 h-4" />
                <span>Percakapan Baru</span>
              </button>

              {/* Sessions list in drawer */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {conversations.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">Belum ada sesi</div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between ${
                        currentConversationId === c.id
                          ? 'bg-brand-violet/20 border border-brand-violet/40 text-brand-violet dark:text-brand-cyan font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{c.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mobile Drawer Bottom: Memory button */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsMemoryOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-brand-teal" />
                  <span>Memori AI</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-violet text-white">
                  {memories.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MEMORY MANAGER MODAL
          ============================================================ */}
      {isMemoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 shadow-2xl relative transition-colors duration-200 animate-bounce-in">
            <button
              onClick={() => setIsMemoryOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <BrainCircuit className="w-5 h-5 text-brand-teal" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Memori & Preferensi AI
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Konteks, tujuan finansial, dan preferensi yang dipelajari AI dari percakapanmu untuk menghasilkan rekomendasi yang konsisten.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {memories.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  <Info className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                  Belum ada memori yang terekam. AI akan otomatis mengingat preferensimu saat berdiskusi.
                </div>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-violet/10 text-brand-violet dark:bg-brand-violet/20 dark:text-brand-cyan mb-1 inline-block">
                        {m.memoryType || 'PREFERENCE'}
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 mt-1">{m.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast &&
        createPortal(
          <div className="fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] animate-bounce-in">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};
