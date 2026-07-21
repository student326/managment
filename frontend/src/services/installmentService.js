import { supabase } from '../supabase/config';

const camelToSnake = (str) => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const toDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]));
const fromDb = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [snakeToCamel(k), v]));

export const getInstallments = async () => {
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromDb);
};

export const addInstallment = async (plan) => {
  const { data, error } = await supabase
    .from('installments')
    .insert(toDb(plan))
    .select()
    .single();

  if (error) throw error;
  return fromDb(data);
};

export const updateInstallment = async (id, data) => {
  const { error } = await supabase
    .from('installments')
    .update(toDb(data))
    .eq('id', id);

  if (error) throw error;
};

export const deleteInstallment = async (id) => {
  const { error } = await supabase
    .from('installments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const subscribeToInstallments = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { callback([], error); return; }
    callback((data ?? []).map(fromDb), null);
  })();

  channel = supabase
    .channel('installments-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'installments' },
      async () => {
        const { data } = await supabase
          .from('installments')
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
