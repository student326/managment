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

export const subscribeToCourses = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('courses')
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
    .channel('courses-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'courses' },
      async () => {
        const { data } = await supabase
          .from('courses')
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

export const addCourse = async (courseData) => {
  const { data, error } = await supabase
    .from('courses')
    .insert(mapToDbColumns(courseData))
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateCourse = async (courseId, courseData) => {
  const { error } = await supabase
    .from('courses')
    .update(mapToDbColumns(courseData))
    .eq('id', courseId);

  if (error) throw error;
};

export const deleteCourse = async (courseId) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
};
