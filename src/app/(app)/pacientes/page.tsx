import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Search } from 'lucide-react'
import { formatDate, formatCurrency, initials } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string }> = {
  ativo:   { label: 'Ativo',   color: 'bg-emerald-400/15 text-emerald-400' },
  inativo: { label: 'Inativo', color: 'bg-muted text-muted-foreground' },
  alta:    { label: 'Alta',    color: 'bg-blue-400/15 text-blue-400' },
}

export default async function PacientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('psychologist_id', user!.id)
    .order('name')

  const ativos   = patients?.filter(p => p.status === 'ativo').length ?? 0
  const inativos = patients?.filter(p => p.status === 'inativo').length ?? 0
  const alta     = patients?.filter(p => p.status === 'alta').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{patients?.length ?? 0} pacientes cadastrados</p>
        </div>
        <Link
          href="/pacientes/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
        >
          <Plus size={15} />
          Novo paciente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ativos',   value: ativos,   color: 'text-emerald-400' },
          { label: 'Inativos', value: inativos, color: 'text-muted-foreground' },
          { label: 'Alta',     value: alta,     color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Lista de pacientes</h2>
        </div>

        {!patients || patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum paciente cadastrado</p>
            <Link href="/pacientes/novo" className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
              Cadastrar primeiro paciente
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {patients.map(p => {
              const st = STATUS[p.status] ?? STATUS.ativo
              return (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{initials(p.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.phone ?? p.email ?? '—'} · {p.session_frequency ?? '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{p.session_fee ? formatCurrency(p.session_fee) : '—'}</p>
                    <p className="text-[10px] text-muted-foreground/60">desde {formatDate(p.created_at)}</p>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
