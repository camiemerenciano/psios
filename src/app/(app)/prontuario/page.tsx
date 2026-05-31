'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Patient { id: string; name: string }
interface Record {
  id?: string
  patient_id: string
  main_complaint: string
  history: string
  diagnostic_hypothesis: string
  icd_code: string
  approach: string
  therapeutic_plan: string
}

export default function ProntuarioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const patientId = searchParams.get('paciente')

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState(patientId ?? '')
  const [form, setForm] = useState<Omit<Record, 'patient_id'>>({
    main_complaint: '',
    history: '',
    diagnostic_hypothesis: '',
    icd_code: '',
    approach: '',
    therapeutic_plan: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('patients').select('id, name').eq('psychologist_id', data.user.id).order('name')
        .then(({ data: pts }) => setPatients(pts ?? []))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedPatient) return
    supabase.from('medical_records').select('*').eq('patient_id', selectedPatient).maybeSingle()
      .then(({ data: rec }) => {
        if (rec) {
          setForm({
            main_complaint:       rec.main_complaint ?? '',
            history:              rec.history ?? '',
            diagnostic_hypothesis: rec.diagnostic_hypothesis ?? '',
            icd_code:             rec.icd_code ?? '',
            approach:             rec.approach ?? '',
            therapeutic_plan:     rec.therapeutic_plan ?? '',
          })
        } else {
          setForm({ main_complaint: '', history: '', diagnostic_hypothesis: '', icd_code: '', approach: '', therapeutic_plan: '' })
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient])

  async function handleSave() {
    if (!selectedPatient) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('medical_records').upsert(
      { ...form, patient_id: selectedPatient, psychologist_id: user!.id, updated_at: new Date().toISOString() },
      { onConflict: 'patient_id' }
    )

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fields: { key: keyof typeof form; label: string; hint?: string }[] = [
    { key: 'main_complaint',        label: 'Queixa principal' },
    { key: 'history',               label: 'Histórico / Anamnese' },
    { key: 'diagnostic_hypothesis', label: 'Hipótese diagnóstica' },
    { key: 'icd_code',              label: 'CID-10', hint: 'Ex: F41.1' },
    { key: 'approach',              label: 'Abordagem teórica', hint: 'Ex: TCC, Psicanálise, Humanista...' },
    { key: 'therapeutic_plan',      label: 'Plano terapêutico' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/pacientes" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Prontuário</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro clínico estruturado</p>
        </div>
      </div>

      {/* Seleção de paciente */}
      <div className="rounded-xl bg-card border border-border p-5">
        <label className="block text-sm font-medium text-foreground/80 mb-2">Paciente</label>
        <select
          value={selectedPatient}
          onChange={e => setSelectedPatient(e.target.value)}
          className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        >
          <option value="">Selecionar paciente...</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Form */}
      {selectedPatient && (
        <div className="rounded-xl bg-card border border-border p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FileText size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Dados clínicos</h2>
          </div>

          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {f.label}
                {f.hint && <span className="ml-2 text-xs text-muted-foreground font-normal">{f.hint}</span>}
              </label>
              {f.key === 'icd_code' ? (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.hint}
                  className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              ) : (
                <textarea
                  rows={f.key === 'history' || f.key === 'therapeutic_plan' ? 5 : 3}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? 'Salvo!' : 'Salvar prontuário'}
          </button>
        </div>
      )}
    </div>
  )
}
