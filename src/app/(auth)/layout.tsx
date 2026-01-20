import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* <div className="mx-auto max-w-7xl px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-3 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur hover:bg-white/70"
        >
          Back to home
        </Link>
      </div> */}
      <div className="flex  flex-col w-full items-center justify-center px-4 pb-16 pt-6">{children}</div>
    </div>
  )
}
