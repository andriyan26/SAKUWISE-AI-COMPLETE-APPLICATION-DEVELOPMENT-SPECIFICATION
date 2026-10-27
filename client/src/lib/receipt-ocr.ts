/**
 * SAKUWISE AI — Smart Receipt & Bank Screenshot OCR Parser
 * Mendeteksi secara cerdas screenshot m-banking (BCA, Mandiri, BRI, BNI, Dana, GoPay, QRIS, dsb.)
 * serta struk belanja kasir fisik (Indomaret, Alfamart, Superindo, Cafe, dsb.).
 */

export interface ParsedReceiptData {
  merchant: string;
  totalAmount: number;
  date: string;
  categorySuggestion: string;
  isIncome: boolean;
  bankOrChannel: string;
  rawText: string;
  items: Array<{ name: string; price: number; qty: number }>;
  confidence: number;
}

export function parseReceiptText(rawText: string, originalFilename?: string): ParsedReceiptData {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // 1. Deteksi Bank / Saluran Pembayaran
  let bankOrChannel = 'Transfer Bank';
  const banks: Array<{ name: string; pattern: RegExp }> = [
    { name: 'BCA Mobile', pattern: /\b(bca|klikbca|mybca)\b/i },
    { name: 'Livin by Mandiri', pattern: /\b(mandiri|livin)\b/i },
    { name: 'BRImo (BRI)', pattern: /\b(brimo|bri|bank rakyat indonesia)\b/i },
    { name: 'BNI Mobile Banking', pattern: /\b(bni|bni mobile)\b/i },
    { name: 'BSI Mobile', pattern: /\b(bsi|bank syariah indonesia)\b/i },
    { name: 'CIMB Niaga OCTO', pattern: /\b(cimb|octo)\b/i },
    { name: 'PermataMobile', pattern: /\b(permata|permatamobile)\b/i },
    { name: 'Bank Danamon', pattern: /\b(danamon|d-bank)\b/i },
    { name: 'Bank Jago', pattern: /\b(jago|bank jago)\b/i },
    { name: 'SeaBank', pattern: /\b(seabank)\b/i },
    { name: 'Jenius BTPN', pattern: /\b(jenius|btpn)\b/i },
    { name: 'DANA', pattern: /\b(dana)\b/i },
    { name: 'GoPay', pattern: /\b(gopay|gojek)\b/i },
    { name: 'OVO', pattern: /\b(ovo)\b/i },
    { name: 'ShopeePay', pattern: /\b(shopeepay|spay|shopee)\b/i },
    { name: 'LinkAja', pattern: /\b(linkaja)\b/i },
    { name: 'QRIS', pattern: /\b(qris)\b/i },
  ];

  for (const b of banks) {
    if (b.pattern.test(text) || (originalFilename && b.pattern.test(originalFilename))) {
      bankOrChannel = b.name;
      break;
    }
  }

  // 2. Deteksi Arah Arus Kas (Pemasukan vs Pengeluaran)
  let isIncome = false;
  if (
    /uang masuk|transfer masuk|diterima dari|terima dana|dana masuk|kredit/i.test(text) &&
    !/transfer keluar|pembayaran/i.test(text)
  ) {
    isIncome = true;
  }

  // 3. Ekstraksi Nominal (IDR)
  let totalAmount = 0;
  // Cari pola Rp diikuti angka atau kata kunci Nominal/Total/Jumlah/Sebesar
  const amountPatterns = [
    /(?:rp|idr|total|nominal|jumlah|sebesar|bayar)\s*[:=.]*\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/i,
    /(?:rp|idr)\s*([0-9]+(?:[.,][0-9]{3})*)/i,
    /([0-9]{1,3}(?:\.[0-9]{3})+)/, // contoh: 150.000 atau 1.500.000
    /\b([1-9][0-9]{3,8})\b/, // nominal bulat e.g. 50000, 150000
  ];

  for (const pat of amountPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      // Normalisasi format Indonesia: titik sebagai pemisah ribuan
      let clean = match[1].replace(/\s+/g, '');
      if (clean.includes('.') && clean.includes(',')) {
        // format 1.500.000,00 -> hilangkan titik, ganti koma ke titik
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else if (clean.includes('.')) {
        clean = clean.replace(/\./g, '');
      } else if (clean.includes(',')) {
        clean = clean.replace(/,/g, '');
      }
      const num = parseFloat(clean);
      if (num >= 1000 && num <= 500000000) {
        totalAmount = num;
        break;
      }
    }
  }

  // 4. Ekstraksi Penerima / Merchant
  let merchant = '';
  const merchantPatterns = [
    /(?:penerima|ke rekening|tujuan|transfer ke|kepada|merchant|nama merchant|nama toko)\s*[:=.]*\s*([A-Za-z0-9\s.,'-]{3,35})/i,
    /(?:nama)\s*[:=.]*\s*([A-Za-z0-9\s.,'-]{3,30})/i,
  ];

  for (const mp of merchantPatterns) {
    const match = text.match(mp);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/\r?\n.*$/, '');
      if (candidate.length >= 3 && !/berhasil|sukses|transaksi|rekening|nominal/i.test(candidate)) {
        merchant = candidate;
        break;
      }
    }
  }

  // Jika belum ketemu, coba cari baris nama toko umum
  if (!merchant) {
    if (/superindo/i.test(text)) merchant = 'Superindo Supermarket';
    else if (/indomaret/i.test(text)) merchant = 'Indomaret';
    else if (/alfamart/i.test(text)) merchant = 'Alfamart';
    else if (/starbucks/i.test(text)) merchant = 'Starbucks Coffee';
    else if (/kopi kenangan/i.test(text)) merchant = 'Kopi Kenangan';
    else if (/fore coffee/i.test(text)) merchant = 'Fore Coffee';
    else if (/pertamina|spbu/i.test(text)) merchant = 'SPBU Pertamina';
    else if (/pln|listrik/i.test(text)) merchant = 'PLN Pascabayar';
    else if (/tokopedia/i.test(text)) merchant = 'Tokopedia';
    else if (/shopee/i.test(text)) merchant = 'Shopee Indonesia';
    else if (lines.length > 0) {
      // Ambil baris teratas yang terlihat seperti nama
      const firstGoodLine = lines.slice(0, 4).find(
        (l) => l.length >= 4 && l.length <= 40 && !/berhasil|sukses|struk|nota|bca|mandiri|bri|bni/i.test(l)
      );
      if (firstGoodLine) merchant = firstGoodLine;
      else merchant = bankOrChannel !== 'Transfer Bank' ? `Transaksi ${bankOrChannel}` : 'Transaksi Merchant';
    } else {
      merchant = bankOrChannel !== 'Transfer Bank' ? `Transaksi ${bankOrChannel}` : 'Transaksi Merchant';
    }
  }

  // 5. Ekstraksi Tanggal
  let date = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{4})/,
    /(\d{4})[\s/-](\d{1,2})[\s/-](\d{1,2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Ags|Sep|Okt|Nov|Des)[a-z]*\s+(\d{4})/i,
  ];

  for (const dp of datePatterns) {
    const match = text.match(dp);
    if (match) {
      if (match[3] && match[3].length === 4) {
        // Coba parse bulan angka atau nama
        const day = match[1].padStart(2, '0');
        let month = match[2];
        const monthMap: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', jun: '06',
          jul: '07', agu: '08', ags: '08', sep: '09', okt: '10', nov: '11', des: '12'
        };
        if (monthMap[month.toLowerCase().slice(0, 3)]) {
          month = monthMap[month.toLowerCase().slice(0, 3)];
        } else {
          month = month.padStart(2, '0');
        }
        const year = match[3];
        date = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // 6. Rekomendasi Kategori Otomatis
  let categorySuggestion = isIncome ? 'Gaji & Pendapatan' : 'Belanja';
  if (/listrik|pln|token|pdam|air|wifi|indihome|telkom|pulsa|paket data|bpjs/i.test(text)) {
    categorySuggestion = 'Tagihan';
  } else if (/kopi|cafe|resto|makan|food|bakso|sushi|kuliner|minum|warung|dinner|lunch/i.test(text)) {
    categorySuggestion = 'Makan & Minum';
  } else if (/bensin|pertamax|pertalite|spbu|shell|tol|parkir|gojek|grab|maxim|krl|kereta|busway/i.test(text)) {
    categorySuggestion = 'Transportasi';
  } else if (/shopee|tokopedia|lazada|tiktok shop|baju|sepatu|supermarket|mall|mart|beli/i.test(text)) {
    categorySuggestion = 'Belanja';
  } else if (/dokter|klinik|obat|apotek|hospital|kimia farma|guardian|vitamin/i.test(text)) {
    categorySuggestion = 'Kesehatan';
  } else if (/bioskop|xxi|cgv|film|netflix|spotify|game|steam/i.test(text)) {
    categorySuggestion = 'Hiburan';
  } else if (/kursus|buku|sekolah|kuliah|udemy/i.test(text)) {
    categorySuggestion = 'Pendidikan';
  } else if (/kost|sewa|kontrakan|ipl|apartemen/i.test(text)) {
    categorySuggestion = 'Tempat Tinggal';
  }

  // 7. Estimasi Item
  const items = [
    {
      name: `${isIncome ? 'Pemasukan' : 'Pembayaran'}: ${merchant}`,
      price: totalAmount,
      qty: 1,
    },
  ];

  return {
    merchant,
    totalAmount,
    date,
    categorySuggestion,
    isIncome,
    bankOrChannel,
    rawText: text,
    items,
    confidence: totalAmount > 0 ? 0.95 : 0.65,
  };
}

export async function runClientOcr(
  file: File,
  onProgress?: (percent: number, message: string) => void
): Promise<ParsedReceiptData> {
  try {
    // Dynamic import tesseract.js agar bundle awal tetap ringan
    const Tesseract = await import('tesseract.js');

    onProgress?.(15, 'Mempersiapkan mesin AI OCR...');

    const result = await Tesseract.recognize(file, 'ind+eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const p = Math.min(95, Math.round((m.progress || 0) * 80) + 15);
          onProgress?.(p, `Membaca karakter struk/bukti transfer (${p}%)...`);
        }
      },
    });

    onProgress?.(98, 'Menganalisis format bank dan nominal...');
    const text = result?.data?.text || '';

    return parseReceiptText(text, file.name);
  } catch (err) {
    console.warn('Client OCR fallback to filename/heuristic:', err);
    // Fallback jika tesseract gagal memuat language data
    return parseReceiptText('', file.name);
  }
}
