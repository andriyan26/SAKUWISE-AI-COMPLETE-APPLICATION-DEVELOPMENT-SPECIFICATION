# 🚀 SAKUWISE AI — Smart Finance, Brighter Future

> **Aplikasi Manajemen Keuangan Pribadi Berbasis AI Full-Stack (React, Express, TypeScript, Prisma & MySQL)**  
> *Tagline:* **Smart Finance, Brighter Future.**  
> *Slogan:* **"Kelola hari ini, wujudkan mimpi esok."**

---

## 🌟 1. Highlights & Fitur Utama

SAKUWISE AI adalah platform teknologi finansial (*FinTech SaaS*) cerdas berbahasa Indonesia yang dirancang untuk membantu mahasiswa, profesional muda, dan pekerja lepas mengelola pemasukan, pengeluaran, anggaran, dan tabungan dengan pendampingan AI cerdas.

### ✨ Luxury Animated 3D Mascot Login Experience
Diinspirasi oleh konsep animasi karakter 3D interaktif pada referensi video, SAKUWISE AI menghadirkan pengalaman login yang jauh lebih mewah, dinamis, dan hidup:
1. **Intro Multi-Fase Sinematik:** Karakter maskot 3D (*Saku-kun*) berjalan masuk dengan ransel dan topi *backwards*, menyapa pengguna dengan *speech bubble* interaktif, lalu mendorong tablet kaca bercahaya (*glowing glassmorphic tablet*) ke tengah layar disertai efek audio sintetis.
2. **Interactive Eye-Tracking & Head Physics:** Mata dan kepala karakter secara halus mengikuti posisi kursor mouse pengguna secara real-time.
3. **Password Privacy Reactions:** Saat pengguna mengetik password, maskot menutup matanya dengan kedua tangan. Jika tombol *Show Password* (ikon mata) ditekan, maskot akan mengintip (*peeking*) lewat celah jarinya dengan animasi yang menggemaskan!
4. **Procedural Web Audio Engine:** Efek suara sintetis (woosh, dock thud, chirp, peek, success fanfare) diproduksi langsung melalui Web Audio API tanpa perlu aset audio eksternal yang berat, lengkap dengan toggle *mute/unmute*.
5. **One-Click Demo Fill:** Tombol cepat *"Gunakan Akun Demo"* langsung mengisi kredensial demo untuk eksplorasi instan tanpa repot mengetik.
6. **Dua Mode Tampilan:** Pengguna dapat berpindah antara mode *Mascot Stage* (sinematik penuh) dan mode *Split-Screen* (tata letak FinTech SaaS klasik).

---

## 🏗️ 2. Arsitektur Teknologi

### Frontend
- **Framework:** React 18, Vite 5, TypeScript
- **Styling:** Tailwind CSS v3 dengan custom design tokens (Violet `#635BFF`, Teal `#14B8A6`, Cyan `#38BDF8`)
- **Visualisasi & Grafik:** Recharts (AreaChart Arus Kas, Pie/Donut Chart Alokasi Pengeluaran, BarChart Perbandingan Historis)
- **Icons & Motion:** Lucide React, Canvas Confetti
- **Form & Validasi:** React Hook Form + Zod
- **Audio:** Web Audio API Procedural Synthesizer
- **Dark/Light Theme:** Sistem tema variabel CSS dengan persistensi `localStorage` dan zero-flash startup.

### Backend
- **Runtime & Framework:** Node.js v18+, Express.js 4, TypeScript
- **ORM & Database:** Prisma ORM dengan **MySQL 8** (Laragon / XAMPP / Cloud MySQL)
- **Keamanan:** Password hashing dengan **bcryptjs**, autentikasi **JWT Access Token** & HttpOnly Refresh Cookie, validasi request Zod, proteksi data antar pengguna (*multi-tenant isolation*).
- **Presisi Moneter:** Menggunakan tipe `Prisma.Decimal` untuk menjamin perhitungan uang akurat tanpa pembulatan *floating-point error*.

### Agentic AI Architecture
- **Alur 8 Tahap:** *Understand Goal ➔ Plan ➔ Select Tools ➔ Execute ➔ Verify ➔ Respond ➔ Store Memory ➔ User Feedback*.
- **Alat Deterministik SQL (Read-Only Tools):** `get_financial_summary`, `get_transactions`, `get_expense_breakdown`, `compare_financial_periods`, `get_budget_status`, `get_savings_goals`, `calculate_savings_plan`, `detect_spending_anomalies`.
- **Action Draft & Explicit Confirmation Flow:** AI **tidak pernah** mengubah atau menghapus data keuangan tanpa konfirmasi pengguna. Setiap tindakan mutasi (pembuatan anggaran, rencana tabungan) disajikan sebagai draf *preview* yang membutuhkan klik tombol **"Konfirmasi & Simpan"** dari pengguna.
- **Memori Berbasis Izin:** Pengguna dapat meninjau, mengubah, atau menghapus preferensi dan memori yang disimpan oleh asisten AI.

### OCR Receipt Scanner
- Pemindaian struk belanja dengan ekstraksi otomatis *merchant*, tanggal, nominal total, dan *suggested category*.
- Form verifikasi interaktif sebelum data struk disimpan ke database transaksi.

---

## 🗄️ 3. Skema Database (MySQL + Prisma)

Database `sakuwise_ai` terdiri dari 14 tabel yang saling terelasi:
1. `users`: Profil akun, mata uang, zona waktu, tema, password hash.
2. `sessions`: Sesi login aktif dan token refresh.
3. `password_reset_tokens`: Token reset password sekali pakai dengan kedaluwarsa.
4. `categories`: Kategori default dan kustom untuk pemasukan & pengeluaran.
5. `transactions`: Catatan pemasukan dan pengeluaran dengan relasi struk.
6. `receipts`: Metadata file struk dan hasil ekstraksi OCR.
7. `budgets`: Batas anggaran bulanan/kategori dengan ambang batas peringatan (75%, 90%, 100%).
8. `savings_goals`: Target tabungan finansial dengan status dan prioritas.
9. `savings_contributions`: Riwayat setoran tabungan menuju target.
10. `ai_conversations`: Sesi obrolan AI dengan pengguna.
11. `ai_messages`: Riwayat pesan pengguna dan asisten beserta metadata alat (*thought process*).
12. `ai_memories`: Memori preferensi finansial pengguna.
13. `notifications`: Notifikasi sistem (peringatan anggaran, milestone target, info aplikasi).
14. `user_preferences`: Pengaturan kustom per pengguna.

---

## 🚀 4. Panduan Menjalankan Proyek (Local Setup)

### Prasyarat
- **Node.js** v18 atau yang lebih baru.
- **MySQL Server** (misalnya via **Laragon** atau **XAMPP**) berjalan pada port default `3306`.

### Langkah 1: Siapkan Database MySQL
Buka MySQL console atau PhpMyAdmin di Laragon/XAMPP, lalu buat database:
```sql
CREATE DATABASE sakuwise_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Langkah 2: Konfigurasi Environment Backend
Salin file `.env.example` ke `server/.env`:
```bash
cd server
copy .env.example .env
```
Pastikan `DATABASE_URL` sesuai dengan konfigurasi MySQL Anda (default Laragon tanpa password):
```env
DATABASE_URL="mysql://root:@localhost:3306/sakuwise_ai"
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Langkah 3: Setup Prisma & Seed Data Demo
Jalankan migrasi database dan masukkan data demo yang kaya (kategori lengkap, 23 transaksi 3 bulan terakhir, 4 anggaran, 3 target tabungan, notifikasi, dan memori AI):
```bash
npm run prisma:push
npm run prisma:seed
```

### Langkah 4: Jalankan Server & Client

Buka dua terminal terpisah:

**Terminal 1 — Backend API:**
```bash
cd server
npm run dev
# Server aktif di http://localhost:5000
```

**Terminal 2 — Frontend React (Vite):**
```bash
cd client
npm run dev
# Frontend aktif di http://localhost:5173 (atau http://127.0.0.1:5173)
```

Atau dari root folder:
```bash
npm run dev:server
npm run dev:client
```

---

## 🔑 5. Kredensial Akun Demo

Untuk langsung menguji aplikasi tanpa registrasi manual:
- **Email:** `andrian@sakuwise.ai`
- **Password:** `password123`
- *Tips:* Cukup klik tombol **"Gunakan Akun Demo"** di halaman login!

---

## 🧪 6. Pengujian Otomatis (Automated Tests)

Jalankan pengujian backend otomatis:
```bash
cd server
npm test
```
Untuk menjalankan verifikasi *end-to-end* 10 alur API sekaligus:
```bash
node server/tests/e2e-check.js
```
Hasil verifikasi mengonfirmasi 100% kelulusan:
- Autentikasi & JWT token validation.
- Pengambilan ringkasan dashboard terhitung akurat dari MySQL.
- Paginasi dan filtering transaksi.
- Perhitungan penggunaan anggaran dan status peringatan (75%, 90%, 100%).
- Pembaruan progres tujuan tabungan dan kalkulasi tabungan bulanan.
- Analisis rasio kesehatan finansial (*savings rate*, *expense ratio*).
- Eksekusi agen AI multi-langkah dengan alat deterministik SQL.
- Pusat notifikasi dan pembuatan laporan keuangan bulanan.

---

## 📑 7. Daftar Endpoint REST API (/api/v1)

| Modul | Method | Endpoint | Deskripsi |
|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | Pendaftaran pengguna baru |
| | `POST` | `/auth/login` | Login & terbitkan JWT token |
| | `POST` | `/auth/logout` | Invalidation token & logout |
| | `GET` | `/auth/me` | Ambil profil pengguna terautentikasi |
| | `POST` | `/auth/forgot-password` | Kirim token reset password aman |
| | `POST` | `/auth/reset-password` | Eksekusi ubah password dengan token |
| **Dashboard** | `GET` | `/dashboard/summary` | 4 kartu ringkasan saldo, pemasukan, pengeluaran & anggaran |
| | `GET` | `/dashboard/cash-flow` | Arus kas historis bulanan |
| | `GET` | `/dashboard/expense-breakdown` | Persentase pengeluaran per kategori |
| | `GET` | `/dashboard/recent-transactions`| 5 transaksi terbaru |
| | `GET` | `/dashboard/insights` | Insight keuangan otomatis berbasis AI |
| **Transaksi** | `GET` | `/transactions` | Daftar transaksi dengan filter, search, & pagination |
| | `POST` | `/transactions` | Tambah transaksi baru |
| | `GET` | `/transactions/:id` | Detail transaksi tunggal |
| | `PATCH` | `/transactions/:id` | Edit transaksi yang sudah ada |
| | `DELETE`| `/transactions/:id` | Hapus transaksi |
| | `GET` | `/transactions/export/csv` | Unduh data transaksi dalam format CSV |
| **Kategori** | `GET` | `/categories` | Ambil kategori pemasukan & pengeluaran |
| | `POST` | `/categories` | Tambah kategori kustom |
| **Anggaran** | `GET` | `/budgets` | Status anggaran dengan progress & threshold alert |
| | `POST` | `/budgets` | Buat anggaran baru |
| | `PATCH` | `/budgets/:id` | Update batas anggaran |
| | `DELETE`| `/budgets/:id` | Hapus anggaran |
| **Tujuan** | `GET` | `/goals` | Daftar tujuan tabungan & estimasi bulanan |
| | `POST` | `/goals` | Buat tujuan baru |
| | `POST` | `/goals/:id/contributions` | Tambah setoran tabungan |
| **Analisis** | `GET` | `/analytics/cash-flow` | Analisis komparasi arus kas 6 bulan |
| | `GET` | `/analytics/expenses` | Kategori belanja terbesar |
| | `GET` | `/analytics/income` | Sumber pemasukan |
| | `GET` | `/analytics/financial-health` | Skor kesehatan finansial (0-100) & rasio |
| **AI Assistant**| `POST` | `/ai/chat` | Chat dengan agen AI finansial multi-langkah |
| | `GET` | `/ai/conversations` | Daftar riwayat percakapan |
| | `GET` | `/ai/memories` | Lihat daftar memori preferensi pengguna |
| | `DELETE`| `/ai/memories/:id` | Hapus item memori AI |
| | `POST` | `/ai/actions/confirm` | Konfirmasi dan eksekusi draf tindakan AI |
| **Struk OCR** | `POST` | `/receipts/upload` | Unggah & ekstrak informasi struk belanja |
| **Laporan** | `POST` | `/reports/generate` | Hasilkan laporan keuangan periodik (siap cetak/PDF) |
| **Notifikasi** | `GET` | `/notifications` | Ambil daftar notifikasi & unread count |
| | `PATCH` | `/notifications/:id/read` | Tandai notifikasi telah dibaca |
| | `POST` | `/notifications/read-all` | Tandai semua telah dibaca |
| **Pengaturan** | `GET` | `/settings` | Ambil preferensi profil & aplikasi |
| | `PATCH` | `/settings` | Perbarui data preferensi & akun |

---

## 🎨 8. Struktur Direktori Proyek

```
SAKUWISE AI/
├── client/                     # Frontend React + Vite + TypeScript
│   ├── public/                 # Favicon & asset publik
│   └── src/
│       ├── components/
│       │   ├── auth/           # SakuMascot3D & animasi interaktif
│       │   ├── layout/         # AppShell, Sidebar, Topbar, ProtectedRoute
│       │   └── transactions/   # QuickAddModal, ReceiptScannerModal
│       ├── contexts/           # AuthContext, ThemeContext
│       ├── lib/                # api-client, currency, dates, sound
│       ├── pages/              # Halaman Dashboard, Transaksi, Anggaran, Goals,
│       │                       # Analisis, AI Assistant, Laporan, Pengaturan, dsb.
│       ├── router.tsx          # Konfigurasi React Router 7
│       └── App.tsx
├── server/                     # Backend Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma       # 14 model database MySQL
│   │   └── seed.ts             # Script seed data demo Indonesia
│   ├── src/
│   │   ├── config/             # env & Prisma DB instance
│   │   ├── middleware/         # authenticate, errorHandler
│   │   ├── modules/            # Modul auth, dashboard, transactions, budgets,
│   │   │                       # goals, analytics, ai, receipts, reports, notif
│   │   ├── services/ai/        # AIOrchestrator, ToolRegistry, FinancialGuardrails
│   │   └── server.ts           # Entry point Express API
│   └── tests/                  # Automated API tests & e2e-check.js
├── package.json                # Root convenience scripts
├── .env.example                # Template konfigurasi environment
└── README.md                   # Dokumentasi lengkap
```

---

## 🛡️ 9. Lisensi & Hak Cipta
Dibuat dengan dedikasi untuk **SAKUWISE AI — Smart Finance, Brighter Future**.  
Semua hak dilindungi undang-undang.
