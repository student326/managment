import { supabase } from '../supabase/config';

const camelToSnake = (str) => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const toDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]));
const fromDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [snakeToCamel(k), v]));

export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromDb);
};

export const addExpense = async (expense) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(toDb(expense))
    .select()
    .single();

  if (error) throw error;
  return fromDb(data);
};

export const updateExpense = async (id, data) => {
  const { error } = await supabase
    .from('expenses')
    .update(toDb(data))
    .eq('id', id);

  if (error) throw error;
};

export const deleteExpense = async (id) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const subscribeToExpenses = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { callback([], error); return; }
    callback((data ?? []).map(fromDb), null);
  })();

  channel = supabase
    .channel('expenses-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses' },
      async () => {
        const { data } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });
        callback((data ?? []).map(fromDb), null);
      }
    )
    .subscribe();

  return () => {
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
};
