import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-sm text-brand-900 shadow-sm backdrop-blur">
            Premium AI interview practice
          </p>
          <h1 className="font-[var(--font-plus-jakarta)] text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
            Practice interviews with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">
              calmer confidence
            </span>
            .
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            iMock helps you simulate real interviews, track progress, and sharpen answers with a friendly AI assistant.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-glow">
              <Link href="/login">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/60">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6">
            <Stat label="Avg. setup" value="2 min" />
            <Stat label="Practice modes" value="3+" />
            <Stat label="AI insights" value="Instant" />
          </div>
        </div>

        <Card className="rounded-2xl border-white/70 bg-white/60 p-6 shadow-xl backdrop-blur">
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-6">
              <p className="text-sm text-zinc-500">AI Assistant</p>
              <p className="mt-2 text-lg font-medium text-zinc-900">
                “Let’s do a quick behavioral round. I’ll ask 3 questions and score clarity, structure, and impact.”
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniCard title="Clarity" value="A-" hint="Clean, direct" />
              <MiniCard title="Structure" value="B+" hint="STAR-ready" />
              <MiniCard title="Impact" value="A" hint="Strong metrics" />
              <MiniCard title="Pace" value="Good" hint="Confident" />
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/50 px-4 py-3 shadow-sm backdrop-blur">
      <div className="text-xl font-semibold text-zinc-900">{value}</div>
      <div className="text-xs text-zinc-600">{label}</div>
    </div>
  )
}

function MiniCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white/60 px-4 py-4 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
      <div className="mt-1 text-xs text-zinc-600">{hint}</div>
    </div>
  )
}
