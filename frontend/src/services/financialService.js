import {
  getTransactions as svcGetTransactions,
  addTransaction as svcAddTransaction,
  deleteTransaction as svcDeleteTransaction,
} from './transactionService';
import {
  getExpenses as svcGetExpenses,
  addExpense as svcAddExpense,
  updateExpense as svcUpdateExpense,
  deleteExpense as svcDeleteExpense,
} from './expenseService';
import {
  getInstallments as svcGetInstallments,
  addInstallment as svcAddInstallment,
  updateInstallment as svcUpdateInstallment,
  deleteInstallment as svcDeleteInstallment,
} from './installmentService';

export const getTransactions = async () => {
  try {
    return await svcGetTransactions();
  } catch { return []; }
};

export const addTransaction = async (tx) => {
  return await svcAddTransaction(tx);
};

export const deleteTransaction = async (id) => {
  return await svcDeleteTransaction(id);
};

export const getExpenses = async () => {
  try {
    return await svcGetExpenses();
  } catch { return []; }
};

export const addExpense = async (expense) => {
  return await svcAddExpense(expense);
};

export const updateExpense = async (id, data) => {
  return await svcUpdateExpense(id, data);
};

export const deleteExpense = async (id) => {
  return await svcDeleteExpense(id);
};

export const getInstallments = async () => {
  try {
    return await svcGetInstallments();
  } catch { return []; }
};

export const addInstallment = async (plan) => {
  return await svcAddInstallment(plan);
};

export const updateInstallment = async (id, data) => {
  return await svcUpdateInstallment(id, data);
};

export const deleteInstallment = async (id) => {
  return await svcDeleteInstallment(id);
};

export const getFinancialSummary = async (students) => {
  const totalIncome = students.reduce((s, r) => s + (parseFloat(r.paid) || 0), 0);
  const totalPending = students.reduce((s, r) => s + (parseFloat(r.pending) || 0), 0);
  const expenses = await getExpenses();
  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const expensesByCategory = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (parseFloat(e.amount) || 0);
  });

  const recentTransactions = (await getTransactions())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return {
    totalIncome,
    totalPending,
    totalExpenses,
    netBalance,
    expensesByCategory,
    recentTransactions,
    expenseCount: expenses.length,
    studentCount: students.length,
  };
};

export const generateReceiptNumber = () => {
  const now = new Date();
  return `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
};
