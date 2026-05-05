import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] 環境変数が設定されていません。.env.local を確認してください。\n' +
    'VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

/**
 * Supabase接続テスト用関数
 * @returns {{ ok: boolean, message: string }}
 */
export async function testConnection() {
  try {
    const { error } = await supabase.from('listeners').select('id').limit(1)
    if (error) {
      return { ok: false, message: error.message }
    }
    return { ok: true, message: '接続成功' }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}
