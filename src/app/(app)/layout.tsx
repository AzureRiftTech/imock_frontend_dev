import { Sidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import { RequireAuth } from '@/components/require-auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen">
        <div className="flex w-full">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <Topbar />
            <main className="px-4 py-8">
              <div className="w-full">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
