'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Link2,
  FileText,
  User,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  requiresRole?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/interviews', label: 'Interviews', icon: <Calendar className="h-4 w-4" /> },
    { href: '/cv', label: 'CVs', icon: <FileText className="h-4 w-4" /> },
    { href: '/subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-4 w-4" /> },
    { href: '/connected-accounts', label: 'Connections', icon: <Link2 className="h-4 w-4" /> },
    { href: '/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  ]

  if (user?.role === 'super_admin') {
    items.push({
      href: '/super-admin',
      label: 'Super Admin',
      icon: <Shield className="h-4 w-4" />,
      requiresRole: 'super_admin',
    })
  }

  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 border-r border-white/60 bg-white/40 px-4 py-6 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-[var(--font-plus-jakarta)] text-lg font-semibold tracking-tight text-zinc-900">
            iMock
          </span>
        </Link>

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-white/70 text-zinc-900 shadow-sm'
                    : 'text-zinc-700 hover:bg-white/60'
                )}
              >
                <span className={cn('text-brand-700', isActive && 'text-brand-800')}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/70 bg-white/50 p-4 text-xs text-zinc-600">
          <div className="font-medium text-zinc-800">Tip</div>
          <div className="mt-1">Keep answers structured. Try STAR for behavioral questions.</div>
        </div>
      </div>
    </aside>
  )
}
