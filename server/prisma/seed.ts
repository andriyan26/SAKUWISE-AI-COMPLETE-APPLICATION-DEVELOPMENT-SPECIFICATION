import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database SAKUWISE AI...');

  // Clean existing demo data for andrian@sakuwise.ai
  const existingUser = await prisma.user.findUnique({
    where: { email: 'andrian@sakuwise.ai' },
  });

  if (existingUser) {
    console.log('Membersihkan akun demo lama...');
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // Create demo user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.create({
    data: {
      name: 'Andrian Pratama',
      email: 'andrian@sakuwise.ai',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      themePreference: 'dark',
      onboardingCompleted: true,
    },
  });

  console.log(`✅ User demo dibuat: ${user.name} (${user.email})`);

  // Default Categories
  const categoryDefs = [
    // Expenses
    { name: 'Makan & Minum', type: 'EXPENSE', icon: 'Utensils', color: '#EF4444' },
    { name: 'Transportasi', type: 'EXPENSE', icon: 'Car', color: '#F97316' },
    { name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingBag', color: '#EC4899' },
    { name: 'Tagihan & Utilitas', type: 'EXPENSE', icon: 'FileText', color: '#EAB308' },
    { name: 'Hiburan', type: 'EXPENSE', icon: 'Film', color: '#8B5CF6' },
    { name: 'Kesehatan', type: 'EXPENSE', icon: 'Activity', color: '#06B6D4' },
    { name: 'Pendidikan', type: 'EXPENSE', icon: 'BookOpen', color: '#3B82F6' },
    { name: 'Tempat Tinggal', type: 'EXPENSE', icon: 'Home', color: '#10B981' },
    { name: 'Langganan', type: 'EXPENSE', icon: 'CreditCard', color: '#6366F1' },
    { name: 'Lainnya (Pengeluaran)', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B' },
    // Incomes
    { name: 'Gaji Pokok', type: 'INCOME', icon: 'Briefcase', color: '#16A34A' },
    { name: 'Freelance & Proyek', type: 'INCOME', icon: 'Laptop', color: '#0EA5E9' },
    { name: 'Bisnis Sampingan', type: 'INCOME', icon: 'TrendingUp', color: '#14B8A6' },
    { name: 'Investasi & Dividen', type: 'INCOME', icon: 'BarChart2', color: '#8B5CF6' },
    { name: 'Bonus & Hadiah', type: 'INCOME', icon: 'Gift', color: '#F59E0B' },
  ];

  const categoriesMap: { [key: string]: string } = {};
  for (const cat of categoryDefs) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      },
    });
    categoriesMap[cat.name] = created.id;
  }
  console.log(`✅ ${categoryDefs.length} Kategori berhasil dibuat.`);

  // Create Transactions (last 60 days)
  const now = new Date();
  const d = (daysAgo: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  const sampleTransactions = [
    // Income
    { cat: 'Gaji Pokok', type: 'INCOME', title: 'Gaji Bulanan PT Tech Nusantara', amount: 12500000, date: d(2), method: 'Transfer Bank', merchant: 'PT Tech Nusantara' },
    { cat: 'Freelance & Proyek', type: 'INCOME', title: 'Pembayaran UI/UX Web App Fintech', amount: 4800000, date: d(12), method: 'Transfer Bank', merchant: 'Klien Singapura' },
    { cat: 'Investasi & Dividen', type: 'INCOME', title: 'Dividen Reksadana & Saham BBCA', amount: 850000, date: d(18), method: 'E-Wallet', merchant: 'Bibit / Stockbit' },
    { cat: 'Gaji Pokok', type: 'INCOME', title: 'Gaji Pokok Bulan Lalu', amount: 12500000, date: d(32), method: 'Transfer Bank', merchant: 'PT Tech Nusantara' },
    { cat: 'Freelance & Proyek', type: 'INCOME', title: 'Pembuatan Landing Page Produk', amount: 3500000, date: d(40), method: 'Transfer Bank', merchant: 'Startup Studio' },

    // Expenses this month
    { cat: 'Makan & Minum', type: 'EXPENSE', title: 'Makan Siang Bebek Kaleyo', amount: 65000, date: d(1), method: 'E-Wallet', merchant: 'Bebek Kaleyo' },
    { cat: 'Makan & Minum', type: 'EXPENSE', title: 'Kopi Susu & Pastry', amount: 48000, date: d(2), method: 'QRIS', merchant: 'Kopi Kenangan' },
    { cat: 'Belanja', type: 'EXPENSE', title: 'Belanja Mingguan Sayur & Buah', amount: 420000, date: d(3), method: 'Kartu Debit', merchant: 'Superindo' },
    { cat: 'Transportasi', type: 'EXPENSE', title: 'Bensin Pertamax Full Tank', amount: 200000, date: d(4), method: 'E-Wallet', merchant: 'SPBU Pertamina' },
    { cat: 'Tagihan & Utilitas', type: 'EXPENSE', title: 'Token Listrik PLN Rumah', amount: 350000, date: d(5), method: 'Transfer Bank', merchant: 'PLN Mobile' },
    { cat: 'Makan & Minum', type: 'EXPENSE', title: 'Dinner Sushi Tei Weekend', amount: 380000, date: d(6), method: 'Kartu Kredit', merchant: 'Sushi Tei' },
    { cat: 'Langganan', type: 'EXPENSE', title: 'Langganan Netflix Premium & Spotify', amount: 216000, date: d(7), method: 'Kartu Kredit', merchant: 'Netflix & Spotify' },
    { cat: 'Transportasi', type: 'EXPENSE', title: 'Saldo Tol e-Toll Mandiri', amount: 150000, date: d(9), method: 'E-Wallet', merchant: 'Indomaret' },
    { cat: 'Kesehatan', type: 'EXPENSE', title: 'Vitamin C & Suplemen Imunitas', amount: 185000, date: d(10), method: 'E-Wallet', merchant: 'Guardian Pharmacy' },
    { cat: 'Hiburan', type: 'EXPENSE', title: 'Tiket Bioskop IMAX 2 Pax', amount: 140000, date: d(11), method: 'E-Wallet', merchant: 'Cinema XXI' },
    { cat: 'Tempat Tinggal', type: 'EXPENSE', title: 'Iuran Pemeliharaan Lingkungan (IPL)', amount: 450000, date: d(15), method: 'Transfer Bank', merchant: 'Pengelola Cluster' },
    { cat: 'Belanja', type: 'EXPENSE', title: 'Beli Keyboard Mechanical Wireless', amount: 750000, date: d(17), method: 'Kartu Debit', merchant: 'Tokopedia' },
    { cat: 'Makan & Minum', type: 'EXPENSE', title: 'Makan Malam Bersama Tim', amount: 245000, date: d(20), method: 'E-Wallet', merchant: 'Sate Khas Senayan' },
    { cat: 'Pendidikan', type: 'EXPENSE', title: 'Kursus Online Advanced TypeScript', amount: 320000, date: d(24), method: 'Kartu Kredit', merchant: 'Udemy' },

    // Expenses last month
    { cat: 'Belanja', type: 'EXPENSE', title: 'Belanja Bulanan Lengkap', amount: 1250000, date: d(33), method: 'Kartu Debit', merchant: 'Lotte Mart' },
    { cat: 'Tagihan & Utilitas', type: 'EXPENSE', title: 'Internet Fiber Indihome 50Mbps', amount: 385000, date: d(35), method: 'Transfer Bank', merchant: 'Telkom' },
    { cat: 'Makan & Minum', type: 'EXPENSE', title: 'Traktir Ulang Tahun Keluarga', amount: 950000, date: d(38), method: 'Kartu Kredit', merchant: 'Bandar Djakarta' },
    { cat: 'Transportasi', type: 'EXPENSE', title: 'Servis Berkala & Ganti Oli Motor', amount: 320000, date: d(42), method: 'Tunai', merchant: 'Bengkel Resmi Honda' },
  ];

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: categoriesMap[tx.cat] || categoriesMap['Makan & Minum'],
        type: tx.type,
        title: tx.title,
        amount: new Prisma.Decimal(tx.amount),
        paymentMethod: tx.method,
        merchant: tx.merchant,
        transactionDate: tx.date,
        description: `Transaksi otomatis demo ${tx.title}`,
      },
    });
  }
  console.log(`✅ ${sampleTransactions.length} Transaksi riil berhasil dibuat.`);

  // Create Budgets
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: null, // Overall budget
        name: 'Batas Belanja Bulanan Total',
        amount: new Prisma.Decimal(7000000),
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: categoriesMap['Makan & Minum'],
        name: 'Anggaran Kuliner & Kopi',
        amount: new Prisma.Decimal(2000000),
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        alertThreshold: 75,
      },
      {
        userId: user.id,
        categoryId: categoriesMap['Belanja'],
        name: 'Anggaran Belanja Kebutuhan',
        amount: new Prisma.Decimal(1800000),
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: categoriesMap['Hiburan'],
        name: 'Anggaran Hobi & Liburan Akhir Pekan',
        amount: new Prisma.Decimal(800000),
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        alertThreshold: 90,
      },
    ],
  });
  console.log('✅ Anggaran bulanan berhasil dibuat.');

  // Create Savings Goals & Contributions
  const goal1 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'Dana Darurat Siaga (6 Bulan)',
      description: 'Tabungan likuid di reksadana pasar uang untuk keamanan finansial keluarga.',
      targetAmount: new Prisma.Decimal(25000000),
      currentAmount: new Prisma.Decimal(17500000),
      targetDate: new Date(now.getFullYear(), now.getMonth() + 5, 28),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      icon: 'ShieldCheck',
    },
  });

  const goal2 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'MacBook Pro M3 Max untuk Kerja',
      description: 'Upgrade workstation utama untuk menunjang performa pengembangan aplikasi AI.',
      targetAmount: new Prisma.Decimal(32000000),
      currentAmount: new Prisma.Decimal(21500000),
      targetDate: new Date(now.getFullYear(), now.getMonth() + 4, 15),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      icon: 'Laptop',
    },
  });

  const goal3 = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'Liburan Akhir Tahun ke Labuan Bajo',
      description: 'Paket tur sailing komodo 4D3N bersama sahabat.',
      targetAmount: new Prisma.Decimal(8500000),
      currentAmount: new Prisma.Decimal(6200000),
      targetDate: new Date(now.getFullYear(), 11, 20),
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      icon: 'Palmtree',
    },
  });

  // Goal Contributions
  await prisma.savingsContribution.createMany({
    data: [
      { goalId: goal1.id, userId: user.id, amount: new Prisma.Decimal(2500000), note: 'Setoran gajian bulan ini' },
      { goalId: goal1.id, userId: user.id, amount: new Prisma.Decimal(2000000), note: 'Bonus freelance tambahan' },
      { goalId: goal2.id, userId: user.id, amount: new Prisma.Decimal(3000000), note: 'Alokasi khusus gadget kerja' },
      { goalId: goal3.id, userId: user.id, amount: new Prisma.Decimal(1200000), note: 'Tabungan tiket pesawat' },
    ],
  });
  console.log('✅ Target tabungan dan setoran berhasil dibuat.');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'BUDGET_ALERT',
        title: 'Peringatan Anggaran: Makan & Minum',
        message: 'Pengeluaran kategori Makan & Minum telah mencapai 78% dari batas anggaran bulanan.',
        readAt: null,
      },
      {
        userId: user.id,
        type: 'GOAL_MILESTONE',
        title: 'Milestone Tercapai: Dana Darurat! 🎯',
        message: 'Selamat! Target tabungan Dana Daruratmu kini telah mencapai 70% dari target Rp 25.000.000.',
        readAt: d(1),
      },
      {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Laporan Keuangan Bulanan Siap',
        message: 'Ringkasan arus kas dan analisis kebiasaan belanja untuk bulan lalu sudah siap diunduh.',
        readAt: d(3),
      },
    ],
  });

  // Create AI conversation & memories
  const conv = await prisma.aiConversation.create({
    data: {
      userId: user.id,
      title: 'Analisis Pengeluaran & Rencana Investasi',
      messages: {
        create: [
          { role: 'user', content: 'Halo SAKUWISE AI, tolong analisis pengeluaranku bulan ini.' },
          {
            role: 'assistant',
            content: 'Halo Andrian! Berdasarkan data transaksi 30 hari terakhir, total pengeluaranmu terkontrol sangat baik dengan rasio tabungan mencapai 42%. Kategori pengeluaran terbesarmu saat ini adalah Makan & Minum (Rp 1.141.000) dan Belanja (Rp 1.170.000). Sangat direkomendasikan untuk mempertahankan rasio ini agar target Dana Daruratmu tercapai lebih cepat!',
          },
        ],
      },
    },
  });

  await prisma.aiMemory.createMany({
    data: [
      {
        userId: user.id,
        memoryType: 'PREFERENCE',
        content: 'Pengguna memprioritaskan alokasi dana tabungan minimal 25% dari setiap penghasilan rutin.',
        consentStatus: 'APPROVED',
      },
      {
        userId: user.id,
        memoryType: 'GOAL',
        content: 'Fokus utama tahun 2026: Mengamankan Dana Darurat 6 bulan dan upgrade laptop kerja.',
        consentStatus: 'APPROVED',
      },
    ],
  });

  console.log('✅ Seeding selesai sukses! Akun demo siap digunakan: andrian@sakuwise.ai / password123 🎉');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
