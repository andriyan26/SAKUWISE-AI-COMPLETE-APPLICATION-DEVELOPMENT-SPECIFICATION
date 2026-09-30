import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { api } from '../../lib/api-client.js';
import { sound } from '../../lib/sound.js';
import {
  User as UserIcon,
  Sliders,
  Bot,
  Shield,
  Database,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  Moon,
  Sun,
  Sparkles,
  Camera,
  Mail,
  Coins,
  ShieldCheck,
  Check,
  Zap,
  Globe,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=AndrianFintech',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SakuwisePro',
];

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'ai' | 'security' | 'data'>('profile');

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'IDR');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  // AI Preferences
  const [aiStyle, setAiStyle] = useState('Analitis & Bijak');
  const [aiAutoInsight, setAiAutoInsight] = useState(true);

  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Handle Photo File Upload directly from computer/phone
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Validate image format & size
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar yang valid (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setSaveMessage('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.upload('/settings/avatar', formData);
      if (res.success && res.avatarUrl) {
        sound.playSuccess();
        setAvatarUrl(res.avatarUrl);
        updateUser({ avatarUrl: res.avatarUrl });
        setSaveMessage('Foto profil berhasil diunggah dan disimpan!');
        setTimeout(() => setSaveMessage(''), 3500);
      } else {
        alert(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so same file can be chosen again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage('');
    setIsSaving(true);
    try {
      const res = await api.patch('/settings', {
        name,
        currency,
        avatarUrl,
      });
      if (res.success) {
        sound.playSuccess();
        updateUser({ name, currency, avatarUrl });
        setSaveMessage('Profil berhasil diperbarui dengan sempurna!');
        setTimeout(() => setSaveMessage(''), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      const res = await api.post('/settings/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.success) {
        sound.playSuccess();
        setPwMessage('Kata sandi berhasil diubah dan akun Anda aman.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  const handleExportDataJson = () => {
    window.open('http://localhost:5000/api/v1/settings/export-data', '_blank');
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'PERINGATAN KRITIS: Tindakan ini akan menghapus akun dan seluruh data keuangan Anda secara permanen. Apakah Anda yakin?'
      )
    )
      return;

    try {
      await api.delete('/settings/account');
      await logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pengaturan Akun & Profil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sesuaikan profil diri, foto avatar, preferensi tema, kecerdasan buatan AI, dan keamanan data finansialmu.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-64 space-y-1.5 shrink-0 animate-fade-in-up stagger-1">
          {[
            { id: 'profile', label: 'Profil Saya', icon: UserIcon, desc: 'Identitas & Foto' },
            { id: 'preferences', label: 'Preferensi Tampilan', icon: Sliders, desc: 'Tema & Format' },
            { id: 'ai', label: 'Preferensi AI', icon: Bot, desc: 'Gaya & Anomali' },
            { id: 'security', label: 'Keamanan & Sandi', icon: Shield, desc: 'Proteksi Akun' },
            { id: 'data', label: 'Manajemen Data', icon: Database, desc: 'Ekspor & Hak Akses' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-violet to-brand-teal text-white shadow-glow-violet font-bold'
                    : 'bg-white dark:bg-[#151D30]/60 border border-slate-200 dark:border-[#293449]/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1E293B]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{tab.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-xl transition-colors duration-200">
          <div key={activeTab} className="animate-fade-in-up">
            {/* TAB 1: Profile Saya (BEAUTIFIED & LUXURIOUS WITH REAL PHOTO UPLOAD) */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
              {/* Hidden File Input for Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileChange}
              />

              {/* Profile Card Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-violet/20 via-brand-teal/15 to-indigo-500/20 border border-brand-violet/30 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Avatar with Camera Overlay */}
                  <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img
                      src={avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-violet shadow-lg transition-transform group-hover:scale-105"
                    />
                    {/* Hover Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span>Ganti Foto</span>
                    </div>
                    {/* Online badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151D30] flex items-center justify-center shadow-md">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                        {name || user?.name || 'Andrian Pratama'}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-violet text-white shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        PRO VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {user?.email || 'andrian@sakuwise.ai'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        AI Financial Smart Agent
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-brand-teal" />
                        Mata Uang: {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Notification Alert */}
              {saveMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{saveMessage}</span>
                </div>
              )}

              {/* Real File Upload Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-brand-violet" />
                      <span>Unggah Foto Profil dari Komputer / HP</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pilih file foto wajah atau avatar dari perangkat Anda (Maksimal 5MB, format JPG, PNG, WEBP).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-teal hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah Foto...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Pilih & Unggah File Foto</span>
                      </>
                    )}
                  </button>

                  <span className="text-xs text-slate-400">atau drag & drop foto ke sini</span>
                </div>
              </div>

              {/* Preset Avatars Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Atau Pilih Karakter Avatar Cepat
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        avatarUrl === preset
                          ? 'border-brand-violet ring-2 ring-brand-violet/50 scale-105'
                          : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {avatarUrl === preset && (
                        <div className="absolute inset-0 bg-brand-violet/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    URL Avatar Custom (Opsional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bisa juga gunakan URL foto Unsplash atau foto profil online Anda.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alamat Email (Akun Utama)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs sm:text-sm cursor-not-allowed select-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Alamat email terdaftar terkunci demi perlindungan keamanan data keuangan Anda.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mata Uang Utama
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all appearance-none cursor-pointer"
                    >
                      <option value="IDR">IDR - Rupiah Indonesia (Rp)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="SGD">SGD - Singapore Dollar (S$)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="MYR">MYR - Ringgit Malaysia (RM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-violet to-brand-teal hover:opacity-95 text-white transition-all shadow-glow-violet flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Preferences (TAMPILAN & TEMA) */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Preferensi Tampilan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Atur tema visual sistem sesuai kenyamanan mata Anda, baik di siang hari maupun malam hari.
                </p>
              </div>

              {/* Theme Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                {/* Light Theme Card */}
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'border-brand-violet bg-brand-violet/5 shadow-md ring-2 ring-brand-violet/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-brand-violet text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mode Terang (Light)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visual bersih, kontras tinggi, ideal untuk suasana terang di siang hari.
                  </p>
                </div>

                {/* Dark Theme Card */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'border-brand-violet bg-brand-violet/10 shadow-md ring-2 ring-brand-violet/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-900/60 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-brand-violet text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mode Gelap (Dark)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Nuansa futuristik Fintech, ramah mata pada malam hari dan hemat baterai.
                  </p>
                </div>
              </div>

              {/* Sound & Audio notification preference */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 max-w-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Efek Suara Antarmuka</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Suara interaktif saat transaksi dicatat atau target tercapai.
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-brand-violet border-slate-300 focus:ring-brand-violet cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: AI Preferences */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Preferensi Asisten AI</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sesuaikan karakter analitis, persona, dan notifikasi cerdas dari Asisten SAKUWISE AI Anda.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gaya Respon Asisten Finansial
                  </label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                  >
                    <option value="Analitis & Bijak">Analitis & Bijak (Fintech Standard - Direkomendasikan)</option>
                    <option value="Santai & Bersahabat">Santai & Bersahabat (Gaya Kasual Gen-Z)</option>
                    <option value="Ketat & Hemat">Ketat & Disiplin (Mode Penghematan Ekstrem)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Insight Otomatis di Dashboard</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Evaluasi anomali dan saran penghematan real-time
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiAutoInsight}
                    onChange={(e) => setAiAutoInsight(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-violet border-slate-300 focus:ring-brand-violet cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Keamanan & Kata Sandi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ubah kata sandi akunmu secara berkala untuk menjaga kerahasiaan catatan aset finansialmu.
                </p>
              </div>

              {pwMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{pwMessage}</span>
                </div>
              )}
              {pwError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{pwError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-brand-violet transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-violet hover:bg-brand-violet/90 text-white transition-all shadow-glow-violet"
                >
                  Perbarui Kata Sandi
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Data Management & Account Deletion */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Manajemen & Ekspor Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unduh data finansial pribadimu atau kelola hak privasi akun secara mandiri.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Unduh Cadangan Lengkap (JSON)</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Termasuk seluruh transaksi, anggaran, target, dan percakapan AI.
                  </p>
                </div>
                <button
                  onClick={handleExportDataJson}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh JSON</span>
                </button>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-[#293449]">
                <h4 className="text-sm font-bold text-rose-500 mb-1">Zona Bahaya</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Menghapus akun akan memusnahkan seluruh riwayat keuangan dan sesi secara permanen tanpa opsi pemulihan.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Akun Permanen</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
