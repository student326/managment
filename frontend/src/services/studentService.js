import { supabase } from '../supabase/config';

export const subscribeToStudents = (callback) => {
  let channel = null;

  (async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Initial fetch error:', error.message);
      callback([], error);
      return;
    }
    callback(data ?? [], null);
  })();

  channel = supabase
    .channel('students-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      async () => {
        const { data } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        callback(data ?? [], null);
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

export const addStudent = async (studentData) => {
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateStudent = async (studentId, studentData) => {
  const { error } = await supabase
    .from('students')
    .update(studentData)
    .eq('student_id', studentId);

  if (error) throw error;
};

export const deleteStudent = async (studentId) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('student_id', studentId);

  if (error) throw error;
};

export const getNextStudentId = async () => {
  const { data } = await supabase.from('students').select('student_id');
  let maxId = 0;
  (data ?? []).forEach((s) => {
    const num = parseInt(String(s.student_id || '0').replace('STD-', ''));
    if (num > maxId) maxId = num;
  });
  return `STD-${String(maxId + 1).padStart(3, '0')}`;
};
