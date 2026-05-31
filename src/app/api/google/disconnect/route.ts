import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('profiles').update({
    google_access_token: null,
    google_refresh_token: null,
    google_calendar_connected: false,
    google_token_expiry: null,
  }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
