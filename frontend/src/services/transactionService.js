import { supabase } from '../supabase/config';

const camelToSnake = (str) => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const toDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]));
const fromDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [snakeToCamel(k), v]));

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromDb);
};

export const addTransaction = async (tx) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(toDb(tx))
    .select()
    .single();

  if (error) throw error;
  return fromDb(data);
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const subscribeToTransactions = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { callback([], error); return; }
    callback((data ?? []).map(fromDb), null);
  })();

  channel = supabase
    .channel('transactions-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      async () => {
        const { data } = await supabase
          .from('transactions')
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
