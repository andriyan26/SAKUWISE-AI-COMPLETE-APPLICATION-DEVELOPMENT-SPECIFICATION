import React from 'react';
import { HelpCircle, BookOpen, Bot, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpPage: React.FC = () => {
  const faqs = [
    {
      q: 'Bagaimana cara AI SAKUWISE menganalisis keuanganku?',
      a: 'SAKUWISE AI menggunakan kalkulasi deterministik langsung dari transaksi yang Anda catat di database MySQL. AI tidak pernah menebak-nebak angka atau saldo.',
    },
    {
      q: 'Apakah pindai struk OCR otomatis menyimpan transaksi?',
      a: 'Tidak. Sesuai prinsip keamanan finansial, hasil pindai struk akan ditampilkan dalam formulir review terlebih dahulu agar Anda dapat memeriksa merchant, tanggal, dan nominal sebelum menyimpannya.',
    },
    {
      q: 'Bagaimana cara menghubungkan rekening bank?',
      a: 'Pada versi ini, pencatatan transaksi dilakukan secara mandiri (manual) atau melalui pindai struk OCR guna menjaga privasi mutlak kredensial perbankan Anda.',
    },
    {
      q: 'Apakah data saya aman dan terisolasi?',
      a: 'Sangat aman. Setiap query data dilindungi oleh sesi terenkripsi JWT dan kepemilikan user ID yang ketat. Pengguna lain tidak memiliki akses ke data transaksi Anda.',
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pusat Bantuan & Panduan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pelajari cara memaksimalkan fitur cerdas SAKUWISE AI untuk mencapai kebebasan finansial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm transition-colors duration-200">
          <BookOpen className="w-8 h-8 text-brand-violet mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Panduan Dasar</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mulai mencatat transaksi harian dan membuat pos anggaran pertamamu.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm transition-colors duration-200">
          <Bot className="w-8 h-8 text-brand-teal mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Konsultasi AI</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gunakan prompt rekomendasi untuk evaluasi pola belanja dan tabungan.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm transition-colors duration-200">
          <ShieldCheck className="w-8 h-8 text-cyan-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privasi Finansial</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data keuangan Anda terenkripsi dan dapat diunduh kapan saja dalam format JSON/CSV.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-[#151D30] border border-slate-200 dark:border-[#293449] shadow-sm dark:shadow-xl transition-colors duration-200">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Pertanyaan yang Sering Diajukan (FAQ)</h3>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{f.q}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
