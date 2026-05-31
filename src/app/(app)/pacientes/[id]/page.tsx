import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, Video, Phone, Mail, Calendar } from 'lucide-react'
import { formatDate, formatCurrency, formatDateTime, initials } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string }> = {
  ativo:   { label: 'Ativo',   color: 'bg-emerald-400/15 text-emerald-400' },
  inativo: { label: 'Inativo', color: 'bg-muted text-muted-foreground' },
  alta:    { label: 'Alta',    color: 'bg-blue-400/15 text-blue-400' },
}

const SESSION_STATUS: Record<string, { label: string; color: string }> = {
  agendada:  { label: 'Agendada',  color: 'bg-blue-400/15 text-blue-400' },
  realizada: { label: 'Realizada', color: 'bg-emerald-400/15 text-emerald-400' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/15 text-destructive' },
  falta:     { label: 'Falta',     color: 'bg-amber-400/15 text-amber-400' },
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: patient }, { data: record }, { data: sessions }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).eq('psychologist_id', user!.id).single(),
    supabase.from('medical_records').select('*').eq('patient_id', id).maybeSingle(),
    supabase.from('sessions').select('*').eq('patient_id', id).order('scheduled_at', { ascending: false }).limit(10),
  ])

  if (!patient) notFound()

  const st = STATUS[patient.status] ?? STATUS.ativo
  const realizadas = sessions?.filter(s => s.status === 'realizada').length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/pacientes" className="mt-1 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">{initials(patient.name)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">{patient.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-1.5">
              {patient.phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11} />{patient.phone}</span>}
              {patient.email && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} />{patient.email}</span>}
              {patient.birth_date && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar size={11} />{formatDate(patient.birth_date)}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{realizadas}</p>
          <p className="text-xs text-muted-foreground mt-1">Sessões realizadas</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-lg font-bold text-foreground">{patient.session_fee ? formatCurrency(patient.session_fee) : '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor da sessão</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-sm font-semibold text-foreground capitalize">{patient.session_frequency ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Frequência</p>
        </div>
      </div>

      {/* Prontuário */}
      <div className="rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Prontuário</h2>
          </div>
          <Link href={`/prontuario?paciente=${id}`} className="text-xs text-primary hover:text-primary/80 transition-colors">
            {record ? 'Editar' : 'Criar prontuário'}
          </Link>
        </div>
        {record ? (
          <div className="p-5 space-y-4">
            {[
              { label: 'Queixa principal',    value: record.main_complaint },
              { label: 'Histórico / Anamnese', value: record.history },
              { label: 'Hipótese diagnóstica', value: record.diagnostic_hypothesis },
              { label: 'CID-10',               value: record.icd_code },
              { label: 'Abordagem teórica',    value: record.approach },
              { label: 'Plano terapêutico',    value: record.therapeutic_plan },
            ].map(field => (
              <div key={field.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{field.label}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{field.value ?? '—'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Prontuário não criado</p>
            <Link href={`/prontuario?paciente=${id}`} className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors inline-block">
              Criar agora
            </Link>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Video size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Histórico de sessões</h2>
        </div>
        {!sessions || sessions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map(s => {
              const ss = SESSION_STATUS[s.status] ?? SESSION_STATUS.agendada
              return (
                <div key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{formatDateTime(s.scheduled_at)}</span>
                    <div className="flex items-center gap-2">
                      {s.fee && <span className="text-xs text-muted-foreground">{formatCurrency(s.fee)}</span>}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${ss.color}`}>{ss.label}</span>
                    </div>
                  </div>
                  {s.evolution && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.evolution}</p>
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
