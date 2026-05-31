'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, UserPlus, Check, X } from 'lucide-react'

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres',      test: (p: string) => p.length >= 8 },
  { label: '1 letra maiúscula',         test: (p: string) => /[A-Z]/.test(p) },
  { label: '1 letra minúscula',         test: (p: string) => /[a-z]/.test(p) },
  { label: '1 caractere especial',      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName]             = useState('')
  const [crp, setCrp]               = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const passwordValid = PASSWORD_RULES.every(r => r.test(password))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setError('A senha não atende aos requisitos mínimos.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, crp } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        crp,
        email,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure seu consultório digital</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Nome completo</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dr(a). Seu Nome"
            className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">CRP</label>
          <input
            type="text"
            value={crp}
            onChange={e => setCrp(e.target.value)}
            placeholder="00/00000"
            className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map(rule => {
                const ok = rule.test(password)
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {ok ? <Check size={12} /> : <X size={12} />}
                    {rule.label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-all glow-teal disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={15} /> Criar conta</>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  )
}
