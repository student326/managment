import { supabase } from '../supabase/config';

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addTransaction = async (tx) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(tx)
    .select()
    .single();

  if (error) throw error;
  return data;
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
    callback(data ?? [], null);
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
        callback(data ?? [], null);
      }
    )
    .subscribe();

  return () => {
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
};
