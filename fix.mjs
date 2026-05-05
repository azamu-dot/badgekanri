import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) env[key.trim()] = vals.join('=').trim()
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function fix() {
  const { data: periods } = await supabase.from('periods').select('*')
  
  // Find all "May 2026" periods
  const mayPeriods = periods.filter(p => p.label === '2026年5月' || p.label === '2026年05月')
  
  if (mayPeriods.length > 0) {
    const targetPeriodId = mayPeriods[mayPeriods.length - 1].id // pick the last one (seeded)
    
    // update all listener_titles to point to this targetPeriodId
    for (const p of mayPeriods) {
      if (p.id !== targetPeriodId) {
        await supabase.from('listener_titles')
          .update({ period_id: targetPeriodId })
          .eq('period_id', p.id)
          
        await supabase.from('periods').delete().eq('id', p.id)
      }
    }
    
    // Ensure the target is active
    await supabase.from('periods').update({ is_active: false }).neq('id', targetPeriodId)
    await supabase.from('periods').update({ is_active: true }).eq('id', targetPeriodId)
  }
  console.log('Fixed duplicate periods.')
}
fix()
