export interface GoogleEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  htmlLink?: string
}

interface TokenData {
  google_access_token:     string | null
  google_refresh_token:    string | null
  google_token_expiry:     string | null
  google_calendar_connected: boolean | null
}

export async function getValidAccessToken(
  token: TokenData,
  persist: (newToken: string, expiry: string) => Promise<void>
): Promise<string | null> {
  if (!token.google_access_token) return null

  const expiry   = token.google_token_expiry ? new Date(token.google_token_expiry) : null
  const isExpired = expiry ? expiry <= new Date(Date.now() + 60_000) : false

  if (!isExpired) return token.google_access_token
  if (!token.google_refresh_token) return null

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: token.google_refresh_token,
      grant_type:    'refresh_token',
    }),
  })

  const data = await res.json()
  if (!data.access_token) return null

  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString()
  await persist(data.access_token, newExpiry)
  return data.access_token
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } }
  )

  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []) as GoogleEvent[]
}

export function googleEventStart(e: GoogleEvent): string {
  return e.start.dateTime ?? e.start.date ?? ''
}
