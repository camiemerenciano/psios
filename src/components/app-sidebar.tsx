'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Video,
  GraduationCap,
  Building2,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Brain,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { initials } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: React.ElementType }

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/agenda',      label: 'Agenda',       icon: Calendar },
      { href: '/pacientes',   label: 'Pacientes',    icon: Users },
      { href: '/prontuario',  label: 'Prontuário',   icon: FileText },
      { href: '/sessoes',     label: 'Sessões',      icon: Video },
      { href: '/supervisao',  label: 'Supervisão',   icon: GraduationCap },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro/consultorio', label: 'Consultório', icon: Building2 },
      { href: '/financeiro/pessoal',     label: 'Pessoal',     icon: Wallet },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/analise/relatorios',    label: 'Relatórios',    icon: BarChart3 },
      { href: '/analise/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const userInitials = initials(user?.user_metadata?.full_name as string | undefined ?? user?.email)

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-sidebar-border bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Brain size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground leading-none truncate">PsiOS</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Gestão de consultório</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-2 pb-1.5 font-medium">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                      ${active
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground transition-colors'}
                    />
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {(user?.user_metadata?.full_name as string | undefined) ?? 'Psicólogo'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
