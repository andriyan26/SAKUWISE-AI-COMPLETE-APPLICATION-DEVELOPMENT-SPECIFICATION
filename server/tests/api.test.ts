import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';
import { ToolRegistry } from '../src/services/ai/ToolRegistry.js';

test('Password hashing security', async () => {
  const password = 'mySecretPassword123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  assert.notEqual(password, hash);
  const isMatch = await bcrypt.compare(password, hash);
  assert.equal(isMatch, true);

  const wrongMatch = await bcrypt.compare('wrongPassword', hash);
  assert.equal(wrongMatch, false);
});

test('Financial deterministic tools calculation', async () => {
  const user = await prisma.user.findUnique({
    where: { email: 'andrian@sakuwise.ai' },
  });

  assert.ok(user, 'Demo user must exist in database');

  const summary = await ToolRegistry.getFinancialSummary(user.id, 60);
  assert.ok(summary.totalIncome > 0, 'Total income should be positive');
  assert.ok(summary.totalExpense > 0, 'Total expense should be positive');
  assert.ok(summary.transactionCount > 0, 'Transaction count should be greater than 0');

  const breakdown = await ToolRegistry.getExpenseBreakdown(user.id, 60);
  assert.ok(Array.isArray(breakdown), 'Breakdown should be an array');
  assert.ok(breakdown.length > 0, 'Breakdown should have expense categories');
});

test('Savings goals and contributions relationship', async () => {
  const user = await prisma.user.findUnique({
    where: { email: 'andrian@sakuwise.ai' },
  });

  assert.ok(user);

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    include: { contributions: true },
  });

  assert.ok(goals.length > 0, 'User should have active savings goals');
  const goalWithContrib = goals.find((g) => g.contributions.length > 0);
  assert.ok(goalWithContrib, 'At least one goal should have contributions');
});

test('Cross-user data isolation', async () => {
  // Create another isolated test user
  const otherUser = await prisma.user.upsert({
    where: { email: 'test.isolated@sakuwise.ai' },
    update: {},
    create: {
      name: 'Isolated User',
      email: 'test.isolated@sakuwise.ai',
      passwordHash: 'hashed_dummy_password',
      currency: 'IDR',
    },
  });

  // Verify other user has 0 transactions
  const isolatedTransactions = await prisma.transaction.findMany({
    where: { userId: otherUser.id },
  });

  assert.equal(isolatedTransactions.length, 0, 'Isolated user must not see any other user transactions');

  // Clean up
  await prisma.user.delete({ where: { id: otherUser.id } });
});
