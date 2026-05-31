'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, Plus, X, Loader2 } from 'lucide-react'
import { formatDateTime, formatCurrency, initials } from '@/lib/utils'

interface Patient { id: string; name: string; session_fee: number | null }
interface Session {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  session_number: number | null
  notes: string | null
  evolution: string | null
  payment_status: string
  fee: number | null
  modality: string
  patient?: Patient | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  agendada:  { label: 'Agendada',  color: 'bg-blue-400/15 text-blue-400' },
  realizada: { label: 'Realizada', color: 'bg-emerald-400/15 text-emerald-400' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive' },
  falta:     { label: 'Falta',     color: 'bg-amber-400/15 text-amber-400' },
}

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400' },
  pago:     { label: 'Pago',     color: 'text-emerald-400' },
  isento:   { label: 'Isento',   color: 'text-muted-foreground' },
}

export default function SessoesPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)

  const [form, setForm] = useState({
    patient_id: '',
    scheduled_at: '',
    duration_minutes: 50,
    modality: 'presencial',
    status: 'agendada',
    fee: '',
    notes: '',
    evolution: '',
    payment_status: 'pendente',
  })

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('sessions').select('*, patient:patients(id, name, session_fee)').eq('psychologist_id', user.id).order('scheduled_at', { ascending: false }).limit(50),
      supabase.from('patients').select('id, name, session_fee').eq('psychologist_id', user.id).eq('status', 'ativo').order('name'),
    ])

    setSessions((s ?? []) as Session[])
    setPatients(p ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePatientChange(patientId: string) {
    const p = patients.find(pt => pt.id === patientId)
    setForm(prev => ({ ...prev, patient_id: patientId, fee: p?.session_fee?.toString() ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('sessions').insert({
      psychologist_id: user!.id,
      patient_id: form.patient_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      modality: form.modality,
      status: form.status,
      fee: form.fee ? Number(form.fee) : null,
      notes: form.notes || null,
      evolution: form.evolution || null,
      payment_status: form.payment_status,
    })

    setSaving(false)
    setShowForm(false)
    setForm({ patient_id: '', scheduled_at: '', duration_minutes: 50, modality: 'presencial', status: 'agendada', fee: '', notes: '', evolution: '', payment_status: 'pendente' })
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sessões</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sessions.length} sessões registradas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nova sessão'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">Nova sessão</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Paciente *</label>
              <select required value={form.patient_id} onChange={e => handlePatientChange(e.target.value)}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="">Selecionar...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data e hora *</label>
              <input required type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duração (min)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Modalidade</label>
              <select value={form.modality} onChange={e => setForm(p => ({ ...p, modality: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
                <option value="falta">Falta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Valor (R$)</label>
              <input type="number" step="0.01" value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))}
                placeholder="0,00"
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pagamento</label>
              <select value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="isento">Isento</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Evolução / Notas da sessão</label>
              <textarea rows={4} value={form.evolution} onChange={e => setForm(p => ({ ...p, evolution: e.target.value }))}
                placeholder="Registre as evoluções observadas nesta sessão..."
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
            Salvar sessão
          </button>
        </form>
      )}

      {/* Sessions list */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Video size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Video size={28} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map(s => {
              const st  = STATUS_LABELS[s.status] ?? STATUS_LABELS.agendada
              const pay = PAYMENT_LABELS[s.payment_status] ?? PAYMENT_LABELS.pendente
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {initials((s.patient as Patient | null)?.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {(s.patient as Patient | null)?.name ?? 'Paciente'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(s.scheduled_at)} · {s.duration_minutes}min · <span className="capitalize">{s.modality}</span>
                    </p>
                    {s.evolution && <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{s.evolution}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {s.fee && <p className={`text-xs font-medium ${pay.color}`}>{formatCurrency(s.fee)}</p>}
                    <p className={`text-[10px] ${pay.color}`}>{pay.label}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
