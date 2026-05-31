'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                'Dashboard',
  '/agenda':                   'Agenda',
  '/pacientes':                'Pacientes',
  '/prontuario':               'Prontuário',
  '/sessoes':                  'Sessões',
  '/supervisao':               'Supervisão',
  '/financeiro/consultorio':   'Financeiro · Consultório',
  '/financeiro/pessoal':       'Financeiro · Pessoal',
  '/analise/relatorios':       'Análise · Relatórios',
  '/analise/configuracoes':    'Análise · Configurações',
}

export function TopBar() {
  const pathname = usePathname()

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'PsiOS'

  return (
    <header className="h-14 border-b border-border flex items-center px-6 bg-background/80 backdrop-blur-sm shrink-0">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </header>
  )
}
