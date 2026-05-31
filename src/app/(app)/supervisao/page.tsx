'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Plus, X, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Supervision {
  id: string
  supervisor_name: string | null
  scheduled_at: string | null
  cases_discussed: string | null
  insights: string | null
  action_plan: string | null
  cost: number | null
  payment_status: string
  created_at: string
}

const PAY_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400' },
  pago:     { label: 'Pago',     color: 'text-emerald-400' },
}

export default function SupervisaoPage() {
  const supabase = createClient()
  const [records, setRecords]   = useState<Supervision[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [form, setForm] = useState({
    supervisor_name: '',
    scheduled_at: '',
    cases_discussed: '',
    insights: '',
    action_plan: '',
    cost: '',
    payment_status: 'pendente',
  })

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('supervision_records').select('*').eq('psychologist_id', user.id).order('scheduled_at', { ascending: false })
    setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('supervision_records').insert({
      psychologist_id: user!.id,
      supervisor_name: form.supervisor_name || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      cases_discussed: form.cases_discussed || null,
      insights: form.insights || null,
      action_plan: form.action_plan || null,
      cost: form.cost ? Number(form.cost) : null,
      payment_status: form.payment_status,
    })

    setSaving(false)
    setShowForm(false)
    setForm({ supervisor_name: '', scheduled_at: '', cases_discussed: '', insights: '', action_plan: '', cost: '', payment_status: 'pendente' })
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Supervisão</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registros de supervisão clínica</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Novo registro'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">Novo registro de supervisão</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Supervisor(a)</label>
              <input type="text" value={form.supervisor_name} onChange={e => setForm(p => ({ ...p, supervisor_name: e.target.value }))}
                placeholder="Nome do supervisor"
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Casos discutidos</label>
              <textarea rows={3} value={form.cases_discussed} onChange={e => setForm(p => ({ ...p, cases_discussed: e.target.value }))}
                placeholder="Descreva os casos abordados na supervisão..."
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Insights e aprendizados</label>
              <textarea rows={3} value={form.insights} onChange={e => setForm(p => ({ ...p, insights: e.target.value }))}
                placeholder="O que você aprendeu ou percebeu..."
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Plano de ação</label>
              <textarea rows={2} value={form.action_plan} onChange={e => setForm(p => ({ ...p, action_plan: e.target.value }))}
                placeholder="Próximos passos e encaminhamentos..."
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Custo (R$)</label>
              <input type="number" step="0.01" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                placeholder="0,00"
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pagamento</label>
              <select value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <GraduationCap size={15} />}
            Salvar registro
          </button>
        </form>
      )}

      {/* List */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <GraduationCap size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Histórico de supervisões</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center">
            <GraduationCap size={28} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma supervisão registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => {
              const pay = PAY_LABELS[r.payment_status] ?? PAY_LABELS.pendente
              const isExpanded = expanded === r.id
              return (
                <div key={r.id} className="px-5 py-3.5">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{r.supervisor_name ?? 'Supervisão'}</p>
                      <p className="text-xs text-muted-foreground">{r.scheduled_at ? formatDate(r.scheduled_at) : formatDate(r.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {r.cost && <p className={`text-xs font-medium ${pay.color}`}>{formatCurrency(r.cost)}</p>}
                      <p className={`text-[10px] ${pay.color}`}>{pay.label}</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pl-13 space-y-3 pl-[52px]">
                      {r.cases_discussed && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Casos discutidos</p>
                          <p className="text-xs text-foreground whitespace-pre-wrap">{r.cases_discussed}</p>
                        </div>
                      )}
                      {r.insights && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Insights</p>
                          <p className="text-xs text-foreground whitespace-pre-wrap">{r.insights}</p>
                        </div>
                      )}
                      {r.action_plan && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Plano de ação</p>
                          <p className="text-xs text-foreground whitespace-pre-wrap">{r.action_plan}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
