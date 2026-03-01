'use client'

import * as React from 'react'

const INPUT_CLASS =
  'w-full px-4 py-2.5 placeholder-[#9F50E9] border border-[#9F50E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white'

// ─── Single-value autocomplete ────────────────────────────────────────────────

interface AutocompleteInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  className?: string
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return options.slice(0, 10)
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 12)
  }, [value, options])

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        className={className ?? INPUT_CLASS}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full overflow-y-auto rounded-lg border border-[#9F50E9]/40 bg-white shadow-xl"
          style={{ maxHeight: '200px' }}
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className="cursor-pointer px-4 py-2 text-sm text-zinc-800 hover:bg-purple-50 hover:text-purple-700"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Multi-value skills autocomplete (type + pick → adds tags) ────────────────

interface SkillsAutocompleteProps {
  skills: string[]
  onAdd: (skill: string) => void
  onRemove: (skill: string) => void
  options: string[]
  placeholder?: string
}

export function SkillsAutocomplete({
  skills,
  onAdd,
  onRemove,
  options,
  placeholder = 'Type a skill and press Enter',
}: SkillsAutocompleteProps) {
  const [input, setInput] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const q = input.trim().toLowerCase()
    const pool = options.filter((o) => !skills.includes(o))
    if (!q) return pool.slice(0, 8)
    return pool.filter((o) => o.toLowerCase().includes(q)).slice(0, 10)
  }, [input, options, skills])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commit = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onAdd(trimmed)
    }
    setInput('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(input)
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      onRemove(skills[skills.length - 1])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={INPUT_CLASS}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full overflow-y-auto rounded-lg border border-[#9F50E9]/40 bg-white shadow-xl"
          style={{ maxHeight: '200px' }}
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                commit(opt)
              }}
              className="cursor-pointer px-4 py-2 text-sm text-zinc-800 hover:bg-purple-50 hover:text-purple-700"
            >
              {opt}
            </li>
          ))}
          {/* Allow adding custom value if not in list */}
          {input.trim() && !options.some((o) => o.toLowerCase() === input.trim().toLowerCase()) && (
            <li
              onMouseDown={(e) => { e.preventDefault(); commit(input) }}
              className="cursor-pointer border-t border-[#9F50E9]/20 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
            >
              Add &ldquo;{input.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
