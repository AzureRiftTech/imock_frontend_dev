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
import Image from 'next/image'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { useState } from 'react'

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
  const [isOpen, setIsOpen] = useState(true)
  return (
    <>
      {/* OPEN ICON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-6 z-50 rounded-r-lg bg-[#9f50e9] p-2 text-white shadow-lg"
        >
          <IoIosArrowForward size={22} />
        </button>
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          'hidden lg:block z-20 transition-all duration-300',
          isOpen ? 'w-[260px]' : 'w-0'
        )}
      >
        <div
          className={cn(
            'sticky top-0 flex h-screen flex-col gap-6 overflow-hidden border-r bg-white px-4 py-6 transition-transform duration-300',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <Image src="/imock-logo.svg" alt="logo" width={50} height={50} />
            <span className="text-3xl font-semibold text-[#9f50e9]">iMock</span>
          </Link>

          <nav className="space-y-2">
            {/* CLOSE ICON */}
            {isOpen && (
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-zinc-600 hover:text-black"
              >
                <IoIosArrowBack size={20} />
              </button>
            )}

            {/* MENU */}
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-3 text-sm',
                    isActive
                      ? 'bg-[#9f50e9] text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )

}
