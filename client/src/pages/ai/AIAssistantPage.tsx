import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../lib/api-client.js';
import { formatIDR } from '../../lib/currency.js';
import { sound } from '../../lib/sound.js';
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
  Layers,
  BrainCircuit,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Database,
  X,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [key: string]: boolean }>({});

  // Memories tab / modal
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Analisis pengeluaranku bulan ini.',
    'Kategori apa yang paling banyak menghabiskan uangku?',
    'Bantu aku membuat anggaran bulanan.',
    'Buatkan rencana menabung untuk dana darurat.',
    'Bandingkan pengeluaran bulan ini dengan bulan lalu.',
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
    try {
      const res = await api.get(`/ai/conversations/${id}`);
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch (_) {}
  };

  const fetchMemories = async () => {
    try {
      const res = await api.get('/ai/memories');
      if (res.success) setMemories(res.data);
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
    sound.playChirp(700, 0.08);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isThinking) return;

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
        if (!currentConversationId) {
          setCurrentConversationId(res.data.conversationId);
          fetchConversations();
        }

        const assistantMsg = {
          id: res.data.messageId,
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
        alert('Aksi rekomendasi AI berhasil diterapkan!');
        handleSendMessage('Saya telah mengonfirmasi aksi tersebut. Terima kasih!');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menerapkan aksi.');
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: true }));
    sound.playChirp(type === 'like' ? 900 : 400, 0.06);
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
    } catch (_) {}
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left Chat Sidebar (Sessions & Memory) */}
      <div className="w-full md:w-64 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-4 flex flex-col justify-between shrink-0 shadow-sm dark:shadow-xl transition-colors duration-200 animate-fade-in-up stagger-1">
        <div>
          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>Percakapan Baru</span>
          </button>

          {/* Conversation Sessions List */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
            Riwayat Sesi
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Belum ada sesi</div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between group ${
                    currentConversationId === c.id
                      ? 'bg-brand-violet/10 dark:bg-brand-violet/20 border border-brand-violet/30 dark:border-brand-violet/40 text-brand-violet dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom AI Memory Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#293449]">
          <button
            onClick={() => setIsMemoryOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-brand-teal" />
              <span>Memori Cerdas AI</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-brand-violet dark:text-brand-cyan font-bold">
              {memories.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200 animate-fade-in-up stagger-2">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-200 dark:border-[#293449] flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center shadow-glow-violet">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>SAKUWISE AI Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet dark:bg-brand-violet/20 dark:border dark:border-brand-violet/40 dark:text-brand-cyan font-semibold">
                  Agentic Financial Core
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Analisis presisi dengan kalkulasi deterministik</p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            /* Empty State with Greeting & Prompts */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
              <div className="w-14 h-14 rounded-3xl bg-brand-violet/10 dark:bg-brand-violet/20 border border-brand-violet/30 dark:border-brand-violet/40 text-brand-violet dark:text-brand-cyan flex items-center justify-center mb-4 shadow-sm dark:shadow-glow-violet animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Halo, {user?.name || 'Andrian'}! 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Aku SAKUWISE AI, asisten keuangan pribadimu. Aku siap membantu menganalisis pengeluaran, menyusun anggaran cerdas, dan merencanakan target tabunganmu.
              </p>

              {/* Suggested Prompts */}
              <div className="mt-6 w-full space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Mulai dengan pertanyaan ini:
                </span>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-violet dark:text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Messages */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              let metadata = null;
              try {
                if (msg.toolMetadataJson) metadata = JSON.parse(msg.toolMetadataJson);
              } catch (_) {}

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-2xl space-y-2`}>
                    {/* Agentic Thought Process Accordion */}
                    {!isUser && metadata?.thoughtProcess && metadata.thoughtProcess.length > 0 && (
                      <details className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                        <summary className="font-semibold text-brand-violet dark:text-brand-cyan flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>Tahapan Berpikir Agen AI ({metadata.thoughtProcess.length} langkah)</span>
                        </summary>
                        <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-700 dark:text-slate-300 pl-2 border-l border-brand-violet/40">
                          {metadata.thoughtProcess.map((step: string, i: number) => (
                            <div key={i}>{step}</div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-brand-violet to-purple-600 text-white shadow-glow-violet rounded-tr-none font-medium'
                          : 'bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Action Confirmation Card (If AI Proposed an Action Draft) */}
                    {!isUser && metadata?.actionDraft && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-violet/10 to-brand-teal/10 dark:from-brand-violet/20 dark:to-brand-teal/20 border border-brand-violet/40 shadow-sm dark:shadow-glow-violet">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-brand-violet dark:text-brand-cyan" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {metadata.actionDraft.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          {metadata.actionDraft.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmAction(metadata.actionDraft)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terapkan Rekomendasi</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message Actions (Copy & Feedback) */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-1">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors"
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
                          className={`hover:text-emerald-500 flex items-center gap-1 ${
                            feedbackGiven[msg.id] ? 'text-emerald-500' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          className="hover:text-rose-500 flex items-center gap-1"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Thinking Animation */}
          {isThinking && (
            <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-teal flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-violet dark:bg-brand-cyan animate-ping" />
                <span>SAKUWISE AI sedang menganalisis data keuanganmu...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#293449] bg-slate-50/80 dark:bg-slate-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan analisis keuangan, rekomendasi anggaran, atau rencana menabung..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="p-3 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet hover:opacity-95 transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Memory Manager Modal */}
      {isMemoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 shadow-2xl relative transition-colors duration-200">
            <button
              onClick={() => setIsMemoryOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <BrainCircuit className="w-5 h-5 text-brand-teal" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Memori & Preferensi AI</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Daftar konteks dan tujuan yang telah dipelajari AI dari percakapanmu. Kamu berhak menghapus data memori kapan saja.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {memories.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  Belum ada memori yang disimpan.
                </div>
              ) : (
                memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-violet/10 text-brand-violet dark:bg-brand-violet/20 dark:text-brand-cyan mb-1 inline-block">
                        {m.memoryType}
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
    </div>
  );
};
