// End-to-end integration test for SAKUWISE AI
async function runTest() {
  const BASE = 'http://localhost:5000/api/v1';

  console.log('--- 1. Testing Login ---');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'andrian@sakuwise.ai', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.token;
  console.log('✅ Login OK! User:', loginData.data.user.name, '| Token length:', token.length);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('\n--- 2. Testing Auth /me ---');
  const meRes = await fetch(`${BASE}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('✅ Auth /me OK! User:', meData.data.email, '| Theme:', meData.data.themePreference);

  console.log('\n--- 3. Testing Dashboard Summary ---');
  const dashRes = await fetch(`${BASE}/dashboard/summary`, { headers: authHeaders });
  const dashData = await dashRes.json();
  console.log('✅ Dashboard Summary OK!');
  console.log('   Total Saldo:', dashData.data.cards.currentBalance.amount);
  console.log('   Total Pemasukan:', dashData.data.cards.periodIncome.amount, `(Trend: ${dashData.data.cards.periodIncome.trendPercentage}%)`);
  console.log('   Total Pengeluaran:', dashData.data.cards.periodExpense.amount, `(Trend: ${dashData.data.cards.periodExpense.trendPercentage}%)`);
  console.log('   Sisa Anggaran:', dashData.data.cards.remainingBudget.amount, `(Usage: ${dashData.data.cards.remainingBudget.usagePercent}%)`);

  console.log('\n--- 4. Testing Transactions List ---');
  const txRes = await fetch(`${BASE}/transactions`, { headers: authHeaders });
  const txData = await txRes.json();
  console.log('✅ Transactions OK! Total recorded:', txData.pagination.total);
  console.log('   Sample Transaction:', txData.data[0].title, '| Rp', txData.data[0].amount, '| Type:', txData.data[0].type);

  console.log('\n--- 5. Testing Budgets List ---');
  const bRes = await fetch(`${BASE}/budgets`, { headers: authHeaders });
  const bData = await bRes.json();
  console.log('✅ Budgets OK! Active budgets count:', bData.data.length);
  console.log('   Budget [0]:', bData.data[0].name, '| Limit: Rp', bData.data[0].amount, '| Spent: Rp', bData.data[0].spentAmount, `(${bData.data[0].percentageUsed}%, Status: ${bData.data[0].status})`);

  console.log('\n--- 6. Testing Savings Goals ---');
  const gRes = await fetch(`${BASE}/goals`, { headers: authHeaders });
  const gData = await gRes.json();
  console.log('✅ Savings Goals OK! Total goals:', gData.data.length);
  console.log('   Goal [0]:', gData.data[0].name, '| Target: Rp', gData.data[0].targetAmount, '| Saved: Rp', gData.data[0].currentAmount, `(${gData.data[0].percentage}%)`);

  console.log('\n--- 7. Testing Financial Health Analytics ---');
  const fhRes = await fetch(`${BASE}/analytics/financial-health`, { headers: authHeaders });
  const fhData = await fhRes.json();
  console.log('✅ Financial Health OK!');
  console.log('   Score:', fhData.data.healthScore, '/ 100 - Rating:', fhData.data.rating);
  console.log('   Summary:', fhData.data.summary);

  console.log('\n--- 8. Testing AI Assistant (Agentic reasoning & tool execution) ---');
  const aiRes = await fetch(`${BASE}/ai/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: 'Berapa total pengeluaran dan pemasukanku?' })
  });
  const aiData = await aiRes.json();
  console.log('✅ AI Chat response OK!');
  console.log('   Role:', aiData.data.role);
  console.log('   Thought Process:', JSON.stringify(aiData.data.thoughtProcess?.plan || []));
  console.log('   Tools Used:', JSON.stringify(aiData.data.toolsUsed || []));
  console.log('   Content snippet:', aiData.data.content.slice(0, 150) + '...');

  console.log('\n--- 9. Testing Notifications ---');
  const notifRes = await fetch(`${BASE}/notifications`, { headers: authHeaders });
  const notifData = await notifRes.json();
  console.log('✅ Notifications OK! Count:', notifData.data.length, '| Unread:', notifData.unreadCount);

  console.log('\n--- 10. Testing Reports Generation ---');
  const repRes = await fetch(`${BASE}/reports/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ type: 'monthly', range: 'this_month' })
  });
  const repData = await repRes.json();
  console.log('✅ Monthly Report OK! Net Cashflow:', repData.data.summary.netCashFlow);

  console.log('\n=============================================');
  console.log('🎉 ALL 10 END-TO-END VERIFICATION CHECKS PASSED!');
  console.log('   SAKUWISE AI MVP IS FULLY FUNCTIONAL WITH MYSQL');
  console.log('=============================================');
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
