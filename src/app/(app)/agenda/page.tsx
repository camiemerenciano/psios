'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Video, CalendarDays, ExternalLink, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type View = 'week' | 'month'

interface Session {
  id: string
  scheduled_at: string
  status: string
  patient?: { name: string } | null
}

interface GoogleEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  htmlLink?: string
}

function evtStart(e: GoogleEvent) { return e.start.dateTime ?? e.start.date ?? '' }

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function toWeekStart(d: Date) {
  const r = new Date(d)
  r.setDate(d.getDate() - d.getDay())
  r.setHours(0, 0, 0, 0)
  return r
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  agendada:  { label: 'Agendada',  color: 'bg-blue-400/15 text-blue-400' },
  realizada: { label: 'Realizada', color: 'bg-emerald-400/15 text-emerald-400' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive' },
  falta:     { label: 'Falta',     color: 'bg-amber-400/15 text-amber-400' },
}

const DAYS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function AgendaPage() {
  const supabase  = createClient()
  const today     = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const [view, setView]               = useState<View>('week')
  const [anchor, setAnchor]           = useState(new Date())
  const [sessions, setSessions]       = useState<Session[]>([])
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [loading, setLoading]         = useState(true)

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'week') {
      const s = toWeekStart(anchor)
      const e = addDays(s, 6); e.setHours(23, 59, 59, 999)
      return { rangeStart: s, rangeEnd: e }
    }
    // month — expand grid to include leading/trailing days
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const lastOfMonth  = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999)
    const s = toWeekStart(firstOfMonth)
    const lastWeekStart = toWeekStart(lastOfMonth)
    const e = addDays(lastWeekStart, 6); e.setHours(23, 59, 59, 999)
    return { rangeStart: s, rangeEnd: e }
  }, [view, anchor])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: sess }, { data: prof }] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, scheduled_at, status, patient:patients(name)')
        .eq('psychologist_id', user.id)
        .gte('scheduled_at', rangeStart.toISOString())
        .lte('scheduled_at', rangeEnd.toISOString())
        .order('scheduled_at'),
      supabase
        .from('profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single(),
    ])

    setSessions((sess ?? []) as unknown as Session[])
    const connected = prof?.google_calendar_connected ?? false
    setGoogleConnected(connected)

    if (connected) {
      const res = await fetch(`/api/google/events?from=${rangeStart.toISOString()}&to=${rangeEnd.toISOString()}`)
      setGoogleEvents(res.ok ? await res.json() : [])
    } else {
      setGoogleEvents([])
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.toISOString(), rangeEnd.toISOString()])

  useEffect(() => { fetchData() }, [fetchData])

  function navigate(dir: 1 | -1) {
    setAnchor(d => {
      if (view === 'week') return addDays(d, dir * 7)
      return new Date(d.getFullYear(), d.getMonth() + dir, 1)
    })
  }

  function periodLabel() {
    if (view === 'week') {
      const s = toWeekStart(anchor)
      const e = addDays(s, 6)
      return s.getMonth() === e.getMonth()
        ? `${s.getDate()}–${e.getDate()} de ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
        : `${s.getDate()} ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)} ${e.getFullYear()}`
    }
    return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
  }

  function dayEvents(d: Date) {
    const key = d.toDateString()
    return {
      sessions: sessions.filter(s => new Date(s.scheduled_at).toDateString() === key),
      google:   googleEvents.filter(e => { const s = evtStart(e); return s ? new Date(s).toDateString() === key : false }),
    }
  }

  // ── Week view ──────────────────────────────────────────────────────────────
  function WeekGrid() {
    const sw = toWeekStart(anchor)
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(sw, i)
            const isToday = d.toDateString() === today.toDateString()
            const { sessions: ds, google: dg } = dayEvents(d)
            return (
              <div key={i} className={`p-3 border-r last:border-r-0 border-border min-h-32 ${isToday ? 'bg-primary/5' : ''}`}>
                <div className="flex flex-col items-center mb-2">
                  <span className="text-[10px] text-muted-foreground">{DAYS[i]}</span>
                  <span className={`text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {ds.map(s => (
                    <div key={s.id} className="text-[10px] bg-primary/15 text-primary rounded px-1.5 py-0.5 truncate">
                      {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                      {(s.patient as { name: string } | null)?.name?.split(' ')[0]}
                    </div>
                  ))}
                  {dg.map(e => (
                    <div key={e.id} className="text-[10px] bg-emerald-500/15 text-emerald-500 rounded px-1.5 py-0.5 truncate">
                      {e.start.dateTime
                        ? new Date(evtStart(e)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'dia todo'
                      }{' '}{e.summary ?? 'Evento'}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month view ─────────────────────────────────────────────────────────────
  function MonthGrid() {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const gridStart    = toWeekStart(firstOfMonth)
    const cells        = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i))

    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-medium text-muted-foreground border-r last:border-r-0 border-border">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === anchor.getMonth()
            const isToday = d.toDateString() === today.toDateString()
            const { sessions: ds, google: dg } = dayEvents(d)
            const total   = ds.length + dg.length
            const visible = 3

            return (
              <div
                key={i}
                className={[
                  'min-h-[5.5rem] p-2',
                  'border-r border-b border-border',
                  (i + 1) % 7 === 0 ? 'border-r-0' : '',
                  i >= 35 ? 'border-b-0' : '',
                  !inMonth ? 'bg-muted/30' : '',
                  isToday ? 'bg-primary/5' : '',
                ].join(' ')}
              >
                <div className="flex justify-end mb-1">
                  <span className={`text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium ${isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {ds.slice(0, visible).map(s => (
                    <div key={s.id} className="text-[10px] bg-primary/15 text-primary rounded px-1.5 py-0.5 truncate leading-tight">
                      {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                      {(s.patient as { name: string } | null)?.name?.split(' ')[0]}
                    </div>
                  ))}
                  {dg.slice(0, Math.max(0, visible - ds.length)).map(e => (
                    <div key={e.id} className="text-[10px] bg-emerald-500/15 text-emerald-500 rounded px-1.5 py-0.5 truncate leading-tight">
                      {e.start.dateTime
                        ? new Date(evtStart(e)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'dia todo'
                      }{' '}{e.summary ?? 'Evento'}
                    </div>
                  ))}
                  {total > visible && (
                    <p className="text-[10px] text-muted-foreground px-1">+{total - visible} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Upcoming list ──────────────────────────────────────────────────────────
  const upcomingSessions = sessions
    .filter(s => new Date(s.scheduled_at) >= new Date() && s.status === 'agendada')
    .slice(0, 8)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          {googleConnected && (
            <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1.5">
              <CalendarDays size={11} /> Google Agenda sincronizado
            </p>
          )}
        </div>
        <Link href="/sessoes" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all">
          <Plus size={15} /> Nova sessão
        </Link>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-muted border border-border p-1">
          {(['week', 'month'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[200px] text-center select-none">
            {periodLabel()}
          </span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-muted border border-border transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <button
          onClick={() => setAnchor(new Date())}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Calendar */}
      {loading
        ? <div className="flex items-center justify-center py-20"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
        : view === 'week' ? <WeekGrid /> : <MonthGrid />
      }

      {/* Upcoming sessions */}
      {!loading && (
        <div className="rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Video size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Próximas sessões</h2>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {upcomingSessions.map(s => {
                const st = STATUS_LABELS[s.status] ?? STATUS_LABELS.agendada
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Video size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(s.patient as { name: string } | null)?.name ?? 'Paciente'}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.scheduled_at)}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Google connect banner */}
      {!loading && !googleConnected && (
        <div className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Conecte o Google Agenda</p>
              <p className="text-xs text-muted-foreground">Veja seus eventos junto com as sessões</p>
            </div>
          </div>
          <Link href="/analise/configuracoes" className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            Conectar
          </Link>
        </div>
      )}
    </div>
  )
}
