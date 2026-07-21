import { supabase } from '../supabase/config';

export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addExpense = async (expense) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateExpense = async (id, data) => {
  const { error } = await supabase
    .from('expenses')
    .update(data)
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
    callback(data ?? [], null);
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
        callback(data ?? [], null);
      }
    )
    .subscribe();

  return () => {
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
};
