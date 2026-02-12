'use client'

import Footer from '@/components/app-shell/footer'
import { Sidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import Header from '@/components/Header'
import { RequireAuth } from '@/components/require-auth'
import { NotificationProvider } from '@/context/notification-context'
import { usePathname } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const hideNavbar =
    pathname === '/user-details' || pathname?.startsWith('/mock-interview')

  return (
    <RequireAuth>
      <NotificationProvider>
        {/* 🔒 LOCK ENTIRE APP HEIGHT */}
        <div className="h-screen overflow-hidden flex flex-col">
          <Header />

          {/* 🔥 MAIN AREA */}
          <div className="flex flex-1 overflow-hidden">
            {!hideNavbar && <Sidebar />}

            {/* CONTENT AREA */}
            <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
              {!hideNavbar && <Topbar />}

              {/* ✅ ONLY THIS SCROLLS */}
              <main className="flex-1 overflow-y-auto">
                <div className="w-full">
                  {children}
                </div>
              </main>

            </div>
          </div>
        </div>
      </NotificationProvider>
    </RequireAuth>
  )
}
