'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

export function Topbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="text-sm text-zinc-600">Welcome back{user?.username ? `, ${user.username}` : ''}.</div>
        <div className="relative">
          <Button
            variant="outline"
            className="bg-white/60"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <UserCircle className="h-4 w-4" />
            Account
          </Button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-xl backdrop-blur"
            >
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-zinc-800 hover:bg-white"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-zinc-800 hover:bg-white"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  logout()
                  router.push('/login')
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
