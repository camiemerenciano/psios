import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Video, Plus, Users } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  agendada:  { label: 'Agendada',  color: 'bg-blue-400/15 text-blue-400' },
  realizada: { label: 'Realizada', color: 'bg-emerald-400/15 text-emerald-400' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive' },
  falta:     { label: 'Falta',     color: 'bg-amber-400/15 text-amber-400' },
}

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, patient:patients(name)')
    .eq('psychologist_id', user!.id)
    .gte('scheduled_at', startOfWeek.toISOString())
    .lte('scheduled_at', endOfWeek.toISOString())
    .order('scheduled_at')

  const { data: upcoming } = await supabase
    .from('sessions')
    .select('*, patient:patients(name)')
    .eq('psychologist_id', user!.id)
    .gte('scheduled_at', new Date().toISOString())
    .eq('status', 'agendada')
    .order('scheduled_at')
    .limit(10)

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Semana atual</p>
        </div>
        <Link href="/sessoes" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all">
          <Plus size={15} />
          Nova sessão
        </Link>
      </div>

      {/* Week view */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek)
            d.setDate(startOfWeek.getDate() + i)
            const isToday = d.toDateString() === today.toDateString()
            const daySessions = sessions?.filter(s => new Date(s.scheduled_at).toDateString() === d.toDateString()) ?? []
            return (
              <div key={i} className={`p-3 border-r last:border-r-0 border-border min-h-24 ${isToday ? 'bg-primary/5' : ''}`}>
                <div className="flex flex-col items-center mb-2">
                  <span className="text-[10px] text-muted-foreground">{days[i]}</span>
                  <span className={`text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {daySessions.map(s => (
                    <div key={s.id} className="text-[10px] bg-primary/15 text-primary rounded px-1.5 py-0.5 truncate">
                      {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {(s.patient as { name: string } | null)?.name?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Próximas sessões</h2>
        </div>
        {!upcoming || upcoming.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcoming.map((s: { id: string; scheduled_at: string; modality: string; status: string; fee?: number | null; patient?: { name: string } | null }) => {
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
    </div>
  )
}
