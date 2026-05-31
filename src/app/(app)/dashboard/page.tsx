import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, Video, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalPatients },
    { count: todaySessions },
    { data: nextSessions },
    { data: monthTransactions },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id).eq('status', 'ativo'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id).gte('scheduled_at', today + 'T00:00:00').lte('scheduled_at', today + 'T23:59:59'),
    supabase.from('sessions').select('*, patient:patients(name)').eq('psychologist_id', user!.id).gte('scheduled_at', new Date().toISOString()).eq('status', 'agendada').order('scheduled_at').limit(5),
    supabase.from('financial_transactions').select('type, amount').eq('psychologist_id', user!.id).gte('created_at', startOfMonth),
  ])

  const receitas = monthTransactions?.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const despesas = monthTransactions?.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0) ?? 0

  const stats = [
    { label: 'Pacientes ativos',   value: totalPatients ?? 0, icon: Users,       color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Sessões hoje',        value: todaySessions ?? 0, icon: Video,       color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Receita do mês',      value: formatCurrency(receitas), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', isText: true },
    { label: 'Saldo do mês',        value: formatCurrency(receitas - despesas), icon: CheckCircle, color: 'text-violet-400', bg: 'bg-violet-400/10', isText: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Bom dia 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Aqui está um resumo do seu consultório</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={15} className={stat.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.isText ? 'text-lg' : ''} text-foreground`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Próximas sessões */}
      <div className="rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Clock size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Próximas sessões</h2>
        </div>
        {!nextSessions || nextSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar size={28} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {nextSessions.map((session: { id: string; scheduled_at: string; modality: string; patient?: { name: string } | null }) => (
              <div key={session.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Video size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {(session.patient as { name: string } | null)?.name ?? 'Paciente'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(session.scheduled_at)}</p>
                </div>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                  {session.modality}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
