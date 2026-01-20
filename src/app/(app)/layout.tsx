'use client'

import { Sidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import { RequireAuth } from '@/components/require-auth'
import { usePathname } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNavbar = pathname === '/user-details'

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <div className="flex w-full">
          {!hideNavbar && <Sidebar />}
          <div className="min-w-0 flex-1">
            {!hideNavbar && <Topbar />}
            <main className={hideNavbar ? "px-4 py-8" : "px-4 py-8"}>
              <div className="w-full">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
