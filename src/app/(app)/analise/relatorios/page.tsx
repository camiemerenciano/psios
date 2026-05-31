import { createClient } from '@/lib/supabase/server'
import { BarChart3, Users, Video, TrendingUp, GraduationCap, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now   = new Date()
  const y     = now.getFullYear()
  const m     = now.getMonth()

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, m - (5 - i), 1)
    return {
      label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
      start: d.toISOString(),
      end: new Date(y, m - (5 - i) + 1, 0, 23, 59, 59).toISOString(),
    }
  })

  const [
    { count: totalPatients },
    { count: totalSessions },
    { count: doneSessions },
    { count: missedSessions },
    { data: transactions },
    { data: supervisions },
    { data: monthData },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id).eq('status', 'realizada'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('psychologist_id', user!.id).eq('status', 'falta'),
    supabase.from('financial_transactions').select('type, amount, category').eq('psychologist_id', user!.id),
    supabase.from('supervision_records').select('cost').eq('psychologist_id', user!.id),
    supabase.from('sessions').select('scheduled_at, fee, status').eq('psychologist_id', user!.id).eq('status', 'realizada').gte('scheduled_at', months[0].start),
  ])

  const totalReceitas   = transactions?.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const totalDespesas   = transactions?.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const totalSupervision = supervisions?.reduce((s, r) => s + Number(r.cost ?? 0), 0) ?? 0
  const attendanceRate  = totalSessions ? Math.round((doneSessions! / totalSessions) * 100) : 0

  const monthlyRevenue = months.map(month => {
    const revenue = monthData?.filter(s => s.scheduled_at >= month.start && s.scheduled_at <= month.end)
      .reduce((sum, s) => sum + Number(s.fee ?? 0), 0) ?? 0
    return { label: month.label, revenue }
  })

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)

  const stats = [
    { label: 'Total de pacientes',     value: totalPatients ?? 0, icon: Users,          color: 'text-primary',       bg: 'bg-primary/10' },
    { label: 'Sessões realizadas',      value: doneSessions ?? 0,  icon: Video,          color: 'text-blue-400',      bg: 'bg-blue-400/10' },
    { label: 'Taxa de comparecimento', value: `${attendanceRate}%`, icon: Calendar,      color: 'text-violet-400',    bg: 'bg-violet-400/10', isText: true },
    { label: 'Supervisões',             value: supervisions?.length ?? 0, icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral do consultório</p>
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
            <p className={`font-bold text-foreground ${stat.isText ? 'text-xl' : 'text-2xl'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Faturamento por mês (últimos 6 meses)</h2>
        </div>
        <div className="flex items-end gap-3 h-32">
          {monthlyRevenue.map(m => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{m.revenue > 0 ? formatCurrency(m.revenue).replace('R$ ', '') : '—'}</span>
              <div className="w-full rounded-t-lg bg-primary/20 hover:bg-primary/30 transition-colors" style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: m.revenue > 0 ? '4px' : '0' }} />
              <span className="text-[10px] text-muted-foreground/70 capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Financeiro (acumulado)</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Receitas</span>
              <span className="text-xs font-semibold text-emerald-400">{formatCurrency(totalReceitas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Despesas</span>
              <span className="text-xs font-semibold text-destructive">{formatCurrency(totalDespesas)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-xs font-medium text-foreground">Saldo</span>
              <span className={`text-xs font-bold ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                {formatCurrency(totalReceitas - totalDespesas)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Video size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Sessões (acumulado)</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Total agendadas</span>
              <span className="text-xs font-semibold text-foreground">{totalSessions ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Realizadas</span>
              <span className="text-xs font-semibold text-emerald-400">{doneSessions ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Faltas</span>
              <span className="text-xs font-semibold text-destructive">{missedSessions ?? 0}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Custo de supervisão</span>
              <span className="text-xs font-semibold text-amber-400">{formatCurrency(totalSupervision)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
