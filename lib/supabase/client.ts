import { createClientComponentClient } from '@supabase/ssr'

export function createClient() {
  return createClientComponentClient()
}
