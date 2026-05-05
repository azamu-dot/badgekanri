import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wauumjpftesrbioxrpiz.supabase.co';
const supabaseKey = 'sb_publishable_-tYGzrNOpIfvGm4nKqpXMw_18E27y3L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('listeners').upsert({ name: 'test' }, { onConflict: 'name,user_id' });
  console.log('Upsert with name,user_id:', error ? error.message : 'success');

  const { data: d2, error: e2 } = await supabase.from('listeners').upsert({ name: 'test2' }, { onConflict: 'name' });
  console.log('Upsert with name:', e2 ? e2.message : 'success');
}
check();
