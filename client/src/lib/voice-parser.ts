// Natural Language Voice Parser for SAKUWISE AI
// Intelligently extracts transaction fields, goals, and commands from Indonesian / English speech

export interface ParsedVoiceTransaction {
  type: 'EXPENSE' | 'INCOME';
  amount: number | null;
  title: string;
  categoryName?: string;
  paymentMethod: string;
  merchant: string;
  date: string;
  notes: string;
  rawTranscript: string;
  confidence: number;
}

export interface ParsedVoiceGoal {
  name: string;
  targetAmount: number | null;
  targetDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  icon: string;
  description: string;
}

export interface ParsedVoiceContribution {
  amount: number | null;
  note: string;
}

// Convert Indonesian spoken words to numbers
// e.g. "dua ratus lima puluh ribu" -> 250000, "satu juta lima ratus ribu" -> 1500000
const WORD_NUMBERS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
  setengah: 0.5,
};

export function parseIndonesianSpokenNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();

  // 1. Direct patterns like "Rp 50.000", "50000", "50.000", "50,000"
  const directMatch = clean.match(/(?:rp\.?|idr)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)/i);
  let baseNumber: number | null = null;

  // Check for shorthand suffixes like "50k", "50rb", "1.5jt", "2,5 juta", "500 ribu"
  const suffixMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|miliar)/i);
  if (suffixMatch) {
    const val = parseFloat(suffixMatch[1].replace(',', '.'));
    const unit = suffixMatch[2].toLowerCase();
    if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
      return Math.round(val * 1000);
    }
    if (unit === 'jt' || unit === 'juta') {
      return Math.round(val * 1000000);
    }
    if (unit === 'm' || unit === 'miliar') {
      return Math.round(val * 1000000000);
    }
  }

  // 2. Word-based parsing: "dua ratus lima puluh ribu", "satu juta"
  const words = clean.split(/[\s-]+/);
  let total = 0;
  let current = 0;
  let foundWord = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'setengah' && words[i + 1] === 'juta') {
      total += 500000;
      i++;
      foundWord = true;
      continue;
    }

    if (WORD_NUMBERS[w] !== undefined) {
      current += WORD_NUMBERS[w];
      foundWord = true;
    } else if (w === 'belas') {
      current += 10;
      foundWord = true;
    } else if (w === 'puluh') {
      current = current * 10;
      foundWord = true;
    } else if (w === 'ratus') {
      current = current * 100;
      foundWord = true;
    } else if (w === 'ribu' || w === 'rb') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      foundWord = true;
    } else if (w === 'juta' || w === 'jt') {
      total += (current === 0 ? 1 : current) * 1000000;
      current = 0;
      foundWord = true;
    } else if (/^\d+$/.test(w)) {
      current += parseInt(w, 10);
      foundWord = true;
    }
  }

  total += current;

  if (foundWord && total > 0) {
    return total;
  }

  // Fallback to standard digit extraction if words failed
  if (directMatch) {
    const rawVal = directMatch[1].replace(/[.,]/g, '');
    const num = parseInt(rawVal, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return null;
}

export function parseVoiceTransaction(
  transcript: string,
  availableCategories: any[] = []
): ParsedVoiceTransaction {
  const lower = transcript.toLowerCase().trim();
  let confidence = 0.8;

  // 1. Determine Type: Expense vs Income
  let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
  const incomeKeywords = [
    'pemasukan',
    'gaji',
    'dapat',
    'terima',
    'masuk',
    'transfer dari',
    'cair',
    'bonus',
    'dividen',
    'honor',
    'penjualan',
    'pendapatan',
    'keuntungan',
  ];
  const expenseKeywords = [
    'pengeluaran',
    'beli',
    'bayar',
    'keluar',
    'belanja',
    'ongkir',
    'makan',
    'minum',
    'nongkrong',
    'isi bensin',
    'tagihan',
    'jajan',
    'biaya',
    'langganan',
  ];

  const hasIncome = incomeKeywords.some((k) => lower.includes(k));
  const hasExpense = expenseKeywords.some((k) => lower.includes(k));

  if (hasIncome && !hasExpense) {
    type = 'INCOME';
  } else {
    type = 'EXPENSE';
  }

  // 2. Extract Amount
  const parsedAmount = parseIndonesianSpokenNumber(lower);

  // 3. Extract Merchant
  let merchant = '';
  const knownMerchants = [
    'Pertamina',
    'Shell',
    'BP-AKR',
    'Starbucks',
    'Indomaret',
    'Alfamart',
    'Superindo',
    'Hypermart',
    'Transmart',
    'Tokopedia',
    'Shopee',
    'Lazada',
    'TikTok Shop',
    'Grab',
    'Gojek',
    'Solaria',
    'KFC',
    'McDonalds',
    'Chatime',
    'Kopi Kenangan',
    'Janji Jiwa',
    'Mixue',
    'PLN',
    'PDAM',
    'Telkomsel',
    'Indosat',
    'XL Axiata',
    'Cinema XXI',
    'CGV',
    'Gramedia',
  ];

  for (const m of knownMerchants) {
    if (lower.includes(m.toLowerCase())) {
      merchant = m;
      break;
    }
  }

  // Also check pattern "di [Merchant]" or "ke [Merchant]"
  if (!merchant) {
    const locMatch = lower.match(/(?:di|ke)\s+([a-z0-9\s]+?)(?:\s+(?:sebesar|seharga|pakai|bayar|menggunakan|pada|tanggal|kemarin|hari|dengan)|\s*$)/i);
    if (locMatch && locMatch[1].trim().length > 2) {
      const candidate = locMatch[1].trim();
      // Skip common words
      if (!['mana', 'sana', 'sini', 'rekening', 'bank', 'kantor'].includes(candidate)) {
        merchant = candidate
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  }

  // 4. Extract Category
  let categoryName = '';
  if (type === 'INCOME') {
    if (lower.includes('gaji') || lower.includes('payroll')) categoryName = 'Gaji';
    else if (lower.includes('investasi') || lower.includes('dividen') || lower.includes('saham'))
      categoryName = 'Investasi';
    else if (lower.includes('bonus') || lower.includes('thr')) categoryName = 'Bonus';
    else categoryName = 'Pemasukan Lainnya';
  } else {
    if (
      lower.includes('bensin') ||
      lower.includes('pertamax') ||
      lower.includes('pertalite') ||
      lower.includes('solar') ||
      lower.includes('pertamina') ||
      lower.includes('shell') ||
      lower.includes('gojek') ||
      lower.includes('grab') ||
      lower.includes('ojol') ||
      lower.includes('tol') ||
      lower.includes('parkir') ||
      lower.includes('kereta') ||
      lower.includes('taksi')
    ) {
      categoryName = 'Transportasi';
    } else if (
      lower.includes('makan') ||
      lower.includes('minum') ||
      lower.includes('kopi') ||
      lower.includes('kafe') ||
      lower.includes('cafe') ||
      lower.includes('restoran') ||
      lower.includes('resto') ||
      lower.includes('warung') ||
      lower.includes('nasi') ||
      lower.includes('snack') ||
      lower.includes('jajan') ||
      lower.includes('solaria') ||
      lower.includes('kfc') ||
      lower.includes('mcd') ||
      lower.includes('starbucks')
    ) {
      categoryName = 'Makan & Minum';
    } else if (
      lower.includes('belanja') ||
      lower.includes('superindo') ||
      lower.includes('indomaret') ||
      lower.includes('alfamart') ||
      lower.includes('tokopedia') ||
      lower.includes('shopee') ||
      lower.includes('baju') ||
      lower.includes('sepatu') ||
      lower.includes('pakaian') ||
      lower.includes('pasar')
    ) {
      categoryName = 'Belanja';
    } else if (
      lower.includes('listrik') ||
      lower.includes('pln') ||
      lower.includes('air') ||
      lower.includes('pdam') ||
      lower.includes('wifi') ||
      lower.includes('internet') ||
      lower.includes('pulsa') ||
      lower.includes('kuota') ||
      lower.includes('sewa') ||
      lower.includes('kontrakan') ||
      lower.includes('iuran')
    ) {
      categoryName = 'Tagihan';
    } else if (
      lower.includes('obat') ||
      lower.includes('dokter') ||
      lower.includes('apotek') ||
      lower.includes('klinik') ||
      lower.includes('rumah sakit') ||
      lower.includes('vitamin')
    ) {
      categoryName = 'Kesehatan';
    } else if (
      lower.includes('nonton') ||
      lower.includes('bioskop') ||
      lower.includes('game') ||
      lower.includes('steam') ||
      lower.includes('netflix') ||
      lower.includes('spotify') ||
      lower.includes('hiburan') ||
      lower.includes('liburan')
    ) {
      categoryName = 'Hiburan';
    } else if (
      lower.includes('sekolah') ||
      lower.includes('kuliah') ||
      lower.includes('buku') ||
      lower.includes('kursus') ||
      lower.includes('spp')
    ) {
      categoryName = 'Pendidikan';
    }
  }

  // Match against actual categories in user's database if provided
  if (categoryName && availableCategories.length > 0) {
    const matched = availableCategories.find(
      (c) =>
        c.type === type &&
        c.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    if (matched) {
      categoryName = matched.name;
    }
  }

  // 5. Extract Payment Method
  let paymentMethod = 'Transfer Bank';
  if (
    lower.includes('qris') ||
    lower.includes('scan') ||
    lower.includes('barcode')
  ) {
    paymentMethod = 'QRIS';
  } else if (
    lower.includes('gopay') ||
    lower.includes('ovo') ||
    lower.includes('dana') ||
    lower.includes('shopeepay') ||
    lower.includes('linkaja') ||
    lower.includes('e-wallet') ||
    lower.includes('ewallet')
  ) {
    paymentMethod = 'E-Wallet';
  } else if (lower.includes('tunai') || lower.includes('cash') || lower.includes('uang tunai')) {
    paymentMethod = 'Tunai';
  } else if (lower.includes('kartu debit') || lower.includes('debit')) {
    paymentMethod = 'Kartu Debit';
  } else if (lower.includes('kartu kredit') || lower.includes('kredit') || lower.includes('cc')) {
    paymentMethod = 'Kartu Kredit';
  } else if (
    lower.includes('transfer') ||
    lower.includes('bank') ||
    lower.includes('bca') ||
    lower.includes('mandiri') ||
    lower.includes('bri') ||
    lower.includes('bni')
  ) {
    paymentMethod = 'Transfer Bank';
  }

  // 6. Extract Date
  let date = new Date().toISOString().split('T')[0];
  if (lower.includes('kemarin lusa')) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    date = d.toISOString().split('T')[0];
  } else if (lower.includes('kemarin')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  }

  // 7. Clean Title Construction
  let title = '';
  // Clean filler speech words
  let cleanedSpeech = lower
    .replace(/(?:tolong|dong|catat|masukkan|tambah|input|buatkan|transaksi|pengeluaran|pemasukan)/g, '')
    .replace(/(?:sebesar|seharga|nominal|sejumlah)\s*[\d\w\s.,]+/g, '')
    .replace(/(?:pakai|menggunakan|bayar dengan|lewat)\s*(?:transfer|bank|qris|tunai|cash|gopay|ovo|dana|debit|kredit|e-wallet)/g, '')
    .replace(/(?:tadi pagi|tadi siang|tadi sore|tadi malam|hari ini|kemarin)/g, '')
    .trim();

  if (cleanedSpeech.length > 2) {
    // Capitalize words
    title = cleanedSpeech
      .split(' ')
      .filter((w) => w.length > 0)
      .slice(0, 6)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  if (!title) {
    if (merchant) {
      title = `${type === 'INCOME' ? 'Pemasukan dari' : 'Transaksi'} ${merchant}`;
    } else if (categoryName) {
      title = `${categoryName} ${type === 'INCOME' ? 'Bulanan' : 'Rutin'}`;
    } else {
      title = type === 'INCOME' ? 'Pemasukan Rutin' : 'Pengeluaran Harian';
    }
  }

  return {
    type,
    amount: parsedAmount,
    title,
    categoryName,
    paymentMethod,
    merchant,
    date,
    notes: transcript,
    rawTranscript: transcript,
    confidence: parsedAmount ? 0.95 : confidence,
  };
}

export function parseVoiceGoal(transcript: string): ParsedVoiceGoal {
  const lower = transcript.toLowerCase();
  const parsedAmount = parseIndonesianSpokenNumber(lower);

  // Determine icon & category
  let icon = 'Target';
  if (lower.includes('darurat') || lower.includes('aman') || lower.includes('jaga')) {
    icon = 'ShieldCheck';
  } else if (lower.includes('laptop') || lower.includes('komputer') || lower.includes('hp') || lower.includes('gadget') || lower.includes('iphone') || lower.includes('macbook')) {
    icon = 'Laptop';
  } else if (lower.includes('liburan') || lower.includes('jalan') || lower.includes('wisata') || lower.includes('pantai') || lower.includes('travel')) {
    icon = 'Palmtree';
  } else if (lower.includes('mobil') || lower.includes('motor') || lower.includes('kendaraan')) {
    icon = 'Car';
  } else if (lower.includes('rumah') || lower.includes('properti') || lower.includes('apartemen') || lower.includes('tanah')) {
    icon = 'Home';
  } else if (lower.includes('kuliah') || lower.includes('sekolah') || lower.includes('edukasi') || lower.includes('kursus') || lower.includes('s2')) {
    icon = 'GraduationCap';
  }

  // Priority
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (lower.includes('tinggi') || lower.includes('mendesak') || lower.includes('darurat') || lower.includes('penting')) {
    priority = 'HIGH';
  } else if (lower.includes('rendah') || lower.includes('santai') || lower.includes('fleksibel')) {
    priority = 'LOW';
  }

  // Target Date calculation
  const targetDateObj = new Date();
  if (lower.includes('tahun depan') || lower.includes('1 tahun') || lower.includes('satu tahun')) {
    targetDateObj.setFullYear(targetDateObj.getFullYear() + 1);
  } else if (lower.includes('2 tahun') || lower.includes('dua tahun')) {
    targetDateObj.setFullYear(targetDateObj.getFullYear() + 2);
  } else if (lower.includes('3 bulan') || lower.includes('tiga bulan')) {
    targetDateObj.setMonth(targetDateObj.getMonth() + 3);
  } else if (lower.includes('6 bulan') || lower.includes('enam bulan')) {
    targetDateObj.setMonth(targetDateObj.getMonth() + 6);
  } else {
    // Default 12 months ahead
    targetDateObj.setMonth(targetDateObj.getMonth() + 12);
  }

  // Name extraction
  let name = '';
  const nameMatch = lower.match(/(?:target|tujuan|tabungan|beli|rencana|untuk)\s+([a-z0-9\s]+?)(?:\s+(?:sebesar|sejumlah|nominal|\d+|target|untuk|dalam|prioritas)|\s*$)/i);
  if (nameMatch && nameMatch[1].trim().length > 2) {
    name = nameMatch[1]
      .trim()
      .split(' ')
      .slice(0, 5)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  if (!name) {
    if (icon === 'ShieldCheck') name = 'Tabungan Dana Darurat';
    else if (icon === 'Laptop') name = 'Beli Gadget Baru';
    else if (icon === 'Car') name = 'Beli Kendaraan Impian';
    else if (icon === 'Home') name = 'DP Rumah Masa Depan';
    else if (icon === 'Palmtree') name = 'Liburan Akhir Tahun';
    else name = 'Tabungan Impian Finansial';
  }

  return {
    name,
    targetAmount: parsedAmount,
    targetDate: targetDateObj.toISOString().split('T')[0],
    priority,
    icon,
    description: `Dibuat melalui Voice Input AI: "${transcript}"`,
  };
}

export function parseVoiceContribution(transcript: string): ParsedVoiceContribution {
  const parsedAmount = parseIndonesianSpokenNumber(transcript);
  let note = transcript
    .replace(/(?:setor|tabung|masukkan|tambah|nominal|sebesar|sejumlah|\d+|ribu|juta|rb|jt|k)/gi, '')
    .trim();

  if (note.length > 2) {
    note = note.charAt(0).toUpperCase() + note.slice(1);
  } else {
    note = 'Setoran rutin via Voice Note';
  }

  return {
    amount: parsedAmount,
    note,
  };
}
