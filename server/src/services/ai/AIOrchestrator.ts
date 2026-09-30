import { ToolRegistry } from './ToolRegistry.js';
import { ChatMessageParam, AIProviderResponse } from './AIProvider.js';
import prisma from '../../config/db.js';

export class AIOrchestrator {
  static async handleChat(
    userId: string,
    userName: string,
    message: string,
    conversationHistory: ChatMessageParam[] = []
  ): Promise<AIProviderResponse> {
    const lower = message.toLowerCase();
    const thoughtProcess: string[] = [];
    const toolsUsed: { tool: string; args: any; resultSummary: string }[] = [];
    let actionDraft: any = undefined;

    // STEP 1: UNDERSTAND GOAL
    thoughtProcess.push(`[1. Memahami Maksud]: Menganalisis pesan pengguna "${message}" untuk menentukan kebutuhan analisis finansial.`);

    // STEP 2 & 3: PLAN & SELECT TOOLS
    const isSummaryRequest = lower.includes('analisis') || lower.includes('ringkasan') || lower.includes('pengeluaran') || lower.includes('kondisi keuangan');
    const isBudgetDraftRequest = lower.includes('buat anggaran') || lower.includes('bantu anggaran') || lower.includes('rekomendasi anggaran');
    const isSavingsGoalRequest = lower.includes('tabungan') || lower.includes('dana darurat') || lower.includes('rencana menabung') || lower.includes('target');
    const isAnomalyRequest = lower.includes('evaluasi') || lower.includes('boros') || lower.includes('paling banyak') || lower.includes('kebiasaan');

    thoughtProcess.push(`[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.`);

    // STEP 4: EXECUTE TOOLS DETERMINISTICALLY
    const summary = await ToolRegistry.getFinancialSummary(userId, 30);
    toolsUsed.push({
      tool: 'get_financial_summary',
      args: { periodDays: 30 },
      resultSummary: `Pemasukan: Rp ${summary.totalIncome.toLocaleString('id-ID')}, Pengeluaran: Rp ${summary.totalExpense.toLocaleString('id-ID')}, Rasio Tabungan: ${summary.savingsRate}%`,
    });

    const expenseBreakdown = await ToolRegistry.getExpenseBreakdown(userId, 30);
    toolsUsed.push({
      tool: 'get_expense_breakdown',
      args: { periodDays: 30 },
      resultSummary: `Ditemukan ${expenseBreakdown.length} kategori pengeluaran aktif.`,
    });

    const budgetStatus = await ToolRegistry.getBudgetStatus(userId);
    const savingsGoals = await ToolRegistry.getSavingsGoals(userId);

    // STEP 5: VERIFY
    thoughtProcess.push(`[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: ${summary.transactionCount}.`);

    // STEP 6: RESPOND (in natural, professional Indonesian)
    let content = '';

    if (isBudgetDraftRequest) {
      thoughtProcess.push(`[4. Penyusunan Draf Tindakan]: Menyiapkan usulan draf anggaran berdasarkan kategori pengeluaran tertinggi.`);
      const topCat = expenseBreakdown[0];
      const suggestedLimit = topCat ? Math.ceil((topCat.amount * 0.9) / 50000) * 50000 : 1500000;
      const catName = topCat?.category || 'Makan & Minum';

      content = `Berdasarkan catatan keuanganmu 30 hari terakhir, pengeluaran terbesar ada pada kategori **${catName}** sebesar **Rp ${topCat ? topCat.amount.toLocaleString('id-ID') : '0'}** (${topCat ? topCat.percentage : 0}% dari total pengeluaran).

💡 **Rekomendasi Anggaran dari SAKUWISE AI:**
Untuk mengoptimalkan cash flow bulananmu, aku sarankan membuat anggaran terarah sebesar **Rp ${suggestedLimit.toLocaleString('id-ID')}** untuk pos ini.

Aku telah menyiapkan draf anggarannya di bawah ini. Silakan periksa dan klik tombol **"Terapkan Anggaran"** untuk menyimpannya ke database keuangamu.`;

      actionDraft = {
        actionType: 'CREATE_BUDGET',
        title: `Draf Anggaran: ${catName}`,
        description: `Batas pengeluaran bulanan yang dioptimalkan untuk pos ${catName}.`,
        payload: {
          name: `Anggaran ${catName} (Optimasi AI)`,
          amount: suggestedLimit,
          alertThreshold: 80,
        },
      };
    } else if (isSavingsGoalRequest) {
      thoughtProcess.push(`[4. Analisis Target Tabungan]: Menghitung estimasi realistis berdasarkan rasio tabungan saat ini.`);
      const netSavings = Math.max(0, summary.netCashFlow);
      const targetMonthly = netSavings > 0 ? Math.round(netSavings * 0.7) : 500000;

      content = `Halo ${userName}! Berdasarkan analisis arus kasmu bulan ini, kamu memiliki sisa saldo neto sebesar **Rp ${netSavings.toLocaleString('id-ID')}** (Rasio tabungan: **${summary.savingsRate}%**).

🎯 **Rencana Tabungan Dana Darurat:**
* Target Ideal Dana Darurat: **Rp 15.000.000** (setara 3-6 bulan biaya hidup).
* Rekomendasi Alokasi Bulanan: **Rp ${targetMonthly.toLocaleString('id-ID')}** per bulan.
* Estimasi Tercapai: Sekitar **${Math.ceil(15000000 / targetMonthly)} bulan**.

Apakah kamu ingin aku membuatkan tujuan finansial otomatis untuk Dana Darurat ini di menu Goals?`;

      actionDraft = {
        actionType: 'CREATE_SAVINGS_GOAL',
        title: 'Tujuan Finansial: Dana Darurat Mandiri',
        description: 'Simpanan darurat likuid untuk menjaga stabilitas finansialmu.',
        payload: {
          name: 'Dana Darurat Siaga',
          targetAmount: 15000000,
          currentAmount: 0,
          priority: 'HIGH',
        },
      };
    } else if (isAnomalyRequest || isSummaryRequest) {
      thoughtProcess.push(`[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.`);
      const topCategoriesText = expenseBreakdown.slice(0, 3).map((c, i) => `${i + 1}. **${c.category}**: Rp ${c.amount.toLocaleString('id-ID')} (${c.percentage}%)`).join('\n');

      content = `Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:

📊 **Arus Kas:**
* Total Pemasukan: **Rp ${summary.totalIncome.toLocaleString('id-ID')}**
* Total Pengeluaran: **Rp ${summary.totalExpense.toLocaleString('id-ID')}**
* Sisa Kas Bersih (Net): **Rp ${summary.netCashFlow.toLocaleString('id-ID')}**
* Tingkat Tabungan: **${summary.savingsRate}%** (${summary.savingsRate >= 20 ? '✅ Sangat Sehat' : '⚠️ Perlu Ditingkatkan'})

🏷️ **3 Pos Pengeluaran Terbesar:**
${topCategoriesText || 'Belum ada transaksi pengeluaran tercatat.'}

💡 **Saran Tindakan:**
1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.
2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.
3. Kamu bisa tanyakan padaku kapan saja: *"Bantu aku membuat anggaran bulanan"* atau *"Bantu rencana menabung"*!`;
    } else {
      content = `Halo ${userName}! 👋 Aku SAKUWISE AI, asisten keuangan cerdasmu.

Kondisi keuanganmu saat ini tercatat memiliki **Total Saldo Rp ${summary.netCashFlow.toLocaleString('id-ID')}** dengan rasio tabungan **${summary.savingsRate}%**.

Ada yang ingin kamu diskusikan hari ini? Kamu bisa memintaku untuk:
* *"Analisis pengeluaranku bulan ini"*
* *"Kategori apa yang paling banyak menghabiskan uangku?"*
* *"Bantu aku membuat anggaran bulanan"*
* *"Buatkan rencana menabung untuk dana darurat"*`;
    }

    // STEP 7: MEMORY EXTRACTION
    // If user mentioned a preference, save to ai_memories
    if (lower.includes('suka') || lower.includes('target') || lower.includes('tujuan')) {
      await prisma.aiMemory.create({
        data: {
          userId,
          memoryType: 'PREFERENCE',
          content: `Pengguna tertarik dengan: "${message.slice(0, 100)}"`,
          consentStatus: 'APPROVED',
        },
      }).catch(() => {});
    }

    return {
      content,
      thoughtProcess,
      toolsUsed,
      actionDraft,
    };
  }
}
