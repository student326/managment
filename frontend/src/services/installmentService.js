import { supabase } from '../supabase/config';

export const getInstallments = async () => {
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addInstallment = async (plan) => {
  const { data, error } = await supabase
    .from('installments')
    .insert(plan)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInstallment = async (id, data) => {
  const { error } = await supabase
    .from('installments')
    .update(data)
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
    callback(data ?? [], null);
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
        callback(data ?? [], null);
      }
    )
    .subscribe();

  return () => {
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
};
