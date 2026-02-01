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
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import Image from 'next/image'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import { useState, useEffect } from 'react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // ✅ Detect screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width:1024px)') // xl breakpoint

    const handleResize = () => {
      const desktop = mediaQuery.matches
      setIsDesktop(desktop)
      setIsOpen(desktop) // open on desktop, close below
    }

    handleResize()

    mediaQuery.addEventListener('change', handleResize)
    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [])

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/interviews', label: 'Interviews', icon: <Calendar size={18} /> },
    { href: '/cv', label: 'CVs', icon: <FileText size={18} /> },
    { href: '/subscriptions', label: 'Subscriptions', icon: <CreditCard size={18} /> },
    { href: '/connected-accounts', label: 'Connections', icon: <Link2 size={18} /> },
    { href: '/profile', label: 'Profile', icon: <User size={18} /> },
  ]

  if (user?.role === 'super_admin') {
    items.push({
      href: '/super-admin',
      label: 'Super Admin',
      icon: <Shield size={18} />,
    })
  }

  return (
    <>
      {/* ✅ OPEN BUTTON — show only below desktop */}
      {!isOpen && !isDesktop && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-6 z-50 rounded-r-lg bg-[#9f50e9] p-2 text-white shadow-lg"
        >
          <IoIosArrowForward size={22} />
        </button>
      )}

      {/* ✅ BACKDROP — only for tablet/mobile */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR */}
      <aside
        className={cn(
          'fixed lg:relative left-0 top-0 z-40 h-screen transition-all duration-300',
          isOpen ? 'w-[260px]' : 'w-0'
        )}
      >
        <div
          className={cn(
            'flex h-full flex-col gap-6 overflow-hidden border-r bg-white px-4 py-6 transition-transform duration-300',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            isDesktop && 'translate-x-0'
          )}
        >
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <Image src="/imock-logo.svg" alt="logo" width={50} height={50} />
            <span className="text-3xl font-semibold text-[#9f50e9]">iMock</span>
          </Link>

          {/* CLOSE button — hide on desktop */}
          {!isDesktop && (
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-zinc-600 hover:text-black"
            >
              <IoIosArrowBack size={20} />
            </button>
          )}

          {/* MENU */}
          <nav className="space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-3 text-sm transition',
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

      <div
        className="hidden lg:block absolute bottom-0 left-40 w-[800px] h-[400px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at bottom left, rgb(239,225,255) 0%, rgb(239,225,255) 30%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="hidden lg:block absolute bottom-0 right-0 w-[400px] h-[800px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgb(235,217,255) 0%, rgb(235,217,255) 30%, transparent 50%)",
          filter: "blur(40px)",
        }}
      />
    </>
  )
}
