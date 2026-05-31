'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, Plus, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  date: string
  payment_method: string | null
  status: string
  notes: string | null
}

const TYPE_LABELS = {
  receita: { label: 'Receita', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: TrendingUp },
  despesa: { label: 'Despesa', color: 'text-destructive',  bg: 'bg-destructive/15',  icon: TrendingDown },
}

export default function PessoalPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)

  const [form, setForm] = useState({
    type: 'despesa',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'pix',
    status: 'confirmado',
    notes: '',
  })

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('financial_transactions').select('*').eq('psychologist_id', user.id).eq('category', 'pessoal').order('date', { ascending: false })
    setTransactions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('financial_transactions').insert({
      psychologist_id: user!.id,
      category: 'pessoal',
      type: form.type,
      description: form.description,
      amount: Number(form.amount),
      date: form.date,
      payment_method: form.payment_method || null,
      status: form.status,
      notes: form.notes || null,
    })

    setSaving(false)
    setShowForm(false)
    setForm({ type: 'despesa', description: '', amount: '', date: new Date().toISOString().split('T')[0], payment_method: 'pix', status: 'confirmado', notes: '' })
    loadData()
  }

  const receitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)
  const despesas = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Financeiro · Pessoal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Finanças pessoais e desenvolvimento profissional</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Novo lançamento'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Entradas</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(receitas)}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Saídas</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(despesas)}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Saldo</p>
          <p className={`text-xl font-bold ${receitas - despesas >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>{formatCurrency(receitas - despesas)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">Novo lançamento pessoal</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex gap-3">
              {(['receita', 'despesa'] as const).map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${form.type === t ? `${TYPE_LABELS[t].bg} ${TYPE_LABELS[t].color} border-current/30` : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {TYPE_LABELS[t].label}
                </button>
              ))}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição *</label>
              <input required type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Supervisão, Congresso, Aluguel..."
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Valor (R$) *</label>
              <input required type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0,00"
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data *</label>
              <input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Forma de pagamento</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
            Salvar lançamento
          </button>
        </form>
      )}

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Wallet size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Lançamentos pessoais</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center"><p className="text-sm text-muted-foreground">Nenhum lançamento registrado</p></div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map(t => {
              const tp = TYPE_LABELS[t.type as keyof typeof TYPE_LABELS]
              const Icon = tp?.icon ?? TrendingDown
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tp?.bg ?? 'bg-muted'}`}>
                    <Icon size={15} className={tp?.color ?? 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)} · {t.payment_method ?? '—'}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${tp?.color}`}>
                    {t.type === 'despesa' ? '−' : '+'}{formatCurrency(t.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
