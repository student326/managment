const TRANSACTIONS_KEY = 'bursar_transactions';
const EXPENSES_KEY = 'bursar_expenses';
const INSTALLMENTS_KEY = 'bursar_installments';

export const getTransactions = () => {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) || [];
  } catch { return []; }
};

export const addTransaction = (tx) => {
  const transactions = getTransactions();
  const newTx = {
    id: `TXN-${Date.now()}`,
    ...tx,
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTx);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return newTx;
};

export const deleteTransaction = (id) => {
  const transactions = getTransactions().filter((t) => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const getExpenses = () => {
  try {
    return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
  } catch { return []; }
};

export const addExpense = (expense) => {
  const expenses = getExpenses();
  const newExpense = {
    id: `EXP-${Date.now()}`,
    ...expense,
    createdAt: new Date().toISOString(),
  };
  expenses.push(newExpense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  return newExpense;
};

export const updateExpense = (id, data) => {
  const expenses = getExpenses().map((e) => (e.id === id ? { ...e, ...data } : e));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

export const deleteExpense = (id) => {
  const expenses = getExpenses().filter((e) => e.id !== id);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

export const getInstallments = () => {
  try {
    return JSON.parse(localStorage.getItem(INSTALLMENTS_KEY)) || [];
  } catch { return []; }
};

export const addInstallment = (plan) => {
  const installments = getInstallments();
  const newPlan = {
    id: `INST-${Date.now()}`,
    ...plan,
    createdAt: new Date().toISOString(),
  };
  installments.push(newPlan);
  localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
  return newPlan;
};

export const updateInstallment = (id, data) => {
  const installments = getInstallments().map((i) => (i.id === id ? { ...i, ...data } : i));
  localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
};

export const deleteInstallment = (id) => {
  const installments = getInstallments().filter((i) => i.id !== id);
  localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
};

export const getFinancialSummary = (students) => {
  const totalIncome = students.reduce((s, r) => s + (parseFloat(r.paid) || 0), 0);
  const totalPending = students.reduce((s, r) => s + (parseFloat(r.pending) || 0), 0);
  const expenses = getExpenses();
  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const expensesByCategory = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (parseFloat(e.amount) || 0);
  });

  const recentTransactions = getTransactions()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
