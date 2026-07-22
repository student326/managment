import { supabase } from '../supabase/config';

const camelToSnake = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const mapToDbColumns = (obj) => {
  const mapped = {};
  for (const [key, value] of Object.entries(obj)) {
    mapped[camelToSnake(key)] = value;
  }
  return mapped;
};

const snakeToCamel = (str) =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const mapFromDbColumns = (obj) => {
  const mapped = {};
  for (const [key, value] of Object.entries(obj)) {
    mapped[snakeToCamel(key)] = value;
  }
  return mapped;
};

export const subscribeToBatches = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Initial fetch error:', error.message);
      callback([], error);
      return;
    }
    callback((data ?? []).map(mapFromDbColumns), null);
  })();

  channel = supabase
    .channel('batches-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'batches' },
      async () => {
        const { data } = await supabase
          .from('batches')
          .select('*')
          .order('created_at', { ascending: false });
        callback((data ?? []).map(mapFromDbColumns), null);
      }
    )
    .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
};

export const addBatch = async (batchData) => {
  const { data, error } = await supabase
    .from('batches')
    .insert(mapToDbColumns(batchData))
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateBatch = async (batchId, batchData) => {
  const { error } = await supabase
    .from('batches')
    .update(mapToDbColumns(batchData))
    .eq('id', batchId);

  if (error) throw error;
};

export const deleteBatch = async (batchId) => {
  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', batchId);

  if (error) throw error;
};
