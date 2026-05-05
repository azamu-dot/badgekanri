import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wauumjpftesrbioxrpiz.supabase.co';
const supabaseKey = 'sb_publishable_-tYGzrNOpIfvGm4nKqpXMw_18E27y3L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Query to list unique constraints/indexes on 'listeners' table
  const { data, error } = await supabase.rpc('get_table_indexes', { table_name: 'listeners' });
  if (error) {
    // If RPC doesn't exist, try a raw query via a temporary function if possible, 
    // or just try to insert with various combinations.
    console.log('RPC failed, checking columns instead...');
    const { data: cols, error: e2 } = await supabase.from('listeners').select('*').limit(0);
    console.log('Columns:', Object.keys(cols?.[0] || {}));
  } else {
    console.log('Indexes:', data);
  }
}
check();
