import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, fetchCalendarEvents } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from')
  const to   = req.nextUrl.searchParams.get('to')

  if (!from || !to) return NextResponse.json([], { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry, google_calendar_connected')
    .eq('id', user.id)
    .single()

  if (!profile?.google_calendar_connected) return NextResponse.json([])

  const accessToken = await getValidAccessToken(profile, async (newToken, expiry) => {
    await supabase.from('profiles').update({
      google_access_token: newToken,
      google_token_expiry: expiry,
    }).eq('id', user.id)
  })

  if (!accessToken) return NextResponse.json([])

  const events = await fetchCalendarEvents(accessToken, from, to)
  return NextResponse.json(events)
}
