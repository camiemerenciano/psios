'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, Loader2, CalendarDays, CheckCircle2, XCircle, Link2Off } from 'lucide-react'

interface Profile {
  full_name: string
  crp: string
  email: string
  phone: string
  approach: string
  session_duration: number
  session_fee: number | null
  bio: string
  google_calendar_connected?: boolean
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    crp: '',
    email: '',
    phone: '',
    approach: '',
    session_duration: 50,
    session_fee: null,
    bio: '',
    google_calendar_connected: false,
  })
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const googleStatus = searchParams.get('google')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
        .then(({ data: prof }) => {
          if (prof) {
            setProfile({
              full_name:                  prof.full_name ?? '',
              crp:                        prof.crp ?? '',
              email:                      prof.email ?? data.user!.email ?? '',
              phone:                      prof.phone ?? '',
              approach:                   prof.approach ?? '',
              session_duration:           prof.session_duration ?? 50,
              session_fee:                prof.session_fee ?? null,
              bio:                        prof.bio ?? '',
              google_calendar_connected:  prof.google_calendar_connected ?? false,
            })
          } else {
            setProfile(p => ({ ...p, email: data.user!.email ?? '', full_name: data.user!.user_metadata?.full_name ?? '' }))
          }
          setLoading(false)
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('profiles').upsert({
      id: user!.id,
      ...profile,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDisconnectGoogle() {
    setDisconnecting(true)
    await fetch('/api/google/disconnect', { method: 'POST' })
    setProfile(p => ({ ...p, google_calendar_connected: false }))
    setDisconnecting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const fields: { key: keyof Profile; label: string; type?: string; placeholder?: string; rows?: number }[] = [
    { key: 'full_name',        label: 'Nome completo',        placeholder: 'Dr(a). Seu Nome' },
    { key: 'crp',              label: 'CRP',                  placeholder: '00/00000' },
    { key: 'email',            label: 'E-mail',               type: 'email', placeholder: 'voce@email.com' },
    { key: 'phone',            label: 'Telefone',             placeholder: '(00) 00000-0000' },
    { key: 'approach',         label: 'Abordagem principal',  placeholder: 'Ex: TCC, Psicanálise, Humanista...' },
    { key: 'session_duration', label: 'Duração padrão da sessão (min)', type: 'number' },
    { key: 'session_fee',      label: 'Valor padrão da sessão (R$)',    type: 'number' },
    { key: 'bio',              label: 'Sobre você',           rows: 4, placeholder: 'Uma breve descrição profissional...' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      {googleStatus === 'connected' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600">
          <CheckCircle2 size={15} /> Google Agenda conectado com sucesso!
        </div>
      )}
      {googleStatus === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <XCircle size={15} /> Falha ao conectar com o Google. Tente novamente.
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Perfil e preferências do consultório</p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl bg-card border border-border p-5 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Settings size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Dados profissionais</h2>
        </div>

        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">{f.label}</label>
            {f.rows ? (
              <textarea
                rows={f.rows}
                value={String(profile[f.key] ?? '')}
                onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={String(profile[f.key] ?? '')}
                onChange={e => setProfile(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) || null : e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? 'Salvo!' : 'Salvar alterações'}
        </button>
      </form>

      {/* Google Agenda */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <CalendarDays size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Integrações</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Google Agenda</p>
              <p className="text-xs text-muted-foreground">
                {profile.google_calendar_connected
                  ? 'Conectado — suas sessões serão sincronizadas'
                  : 'Sincronize sessões com seu calendário Google'}
              </p>
            </div>
          </div>

          {profile.google_calendar_connected ? (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all disabled:opacity-60"
            >
              {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <Link2Off size={13} />}
              Desconectar
            </button>
          ) : (
            <a
              href="/api/google/auth"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
            >
              Conectar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
