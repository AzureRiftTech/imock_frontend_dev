import React, { useEffect, useState } from 'react'
import { fetchFieldSuggestions } from '@/hooks/useAISuggestions'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface Variant {
  type: 'suggestion' | 'condensed' | 'extended'
  text: string
}

interface Props {
  open: boolean
  fieldName: string
  existingValue?: string
  index?: number
  context?: any
  onClose: () => void
  onApply: (text: string) => void
}

export default function SuggestionPanel({ open, fieldName, existingValue, index, context, onClose, onApply }: Props) {
  const [format, setFormat] = useState<'paragraph' | 'bulleted'>('paragraph')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setVariants([])
    setSelected(null)
    fetchFieldSuggestions(fieldName, existingValue, format, index, context)
      .then((data) => {
        const vs = (data?.variants || []).map((v: any) => ({ type: v.type, text: v.text }))
        setVariants(vs)
        if (vs[0]) setSelected(vs[0].type)
      })
      .catch((err) => {
        console.error('Failed to fetch suggestions', err)
      })
      .finally(() => setLoading(false))
  }, [open, fieldName, format, existingValue, index, context])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm font-semibold">AI Suggestions</div>
              <div className="text-xs text-gray-500">Field: {fieldName}</div>
            </div>
            {/* Badge when no options are available */}
            {!loading && variants.length === 0 && (
              <div className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-800">No options yet</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Format:</div>
            <div className="inline-flex rounded-md border overflow-hidden">
              <button className={`px-2 py-1 text-xs ${format === 'paragraph' ? 'bg-purple-50 text-purple-700' : 'text-gray-600'}`} onClick={() => setFormat('paragraph')}>Paragraph</button>
              <button className={`px-2 py-1 text-xs ${format === 'bulleted' ? 'bg-purple-50 text-purple-700' : 'text-gray-600'}`} onClick={() => setFormat('bulleted')}>Bulleted</button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected('suggestion')} className={`px-3 py-1 rounded ${selected === 'suggestion' ? 'bg-gray-100' : ''}`}>Suggestion</button>
            <button onClick={() => setSelected('condensed')} className={`px-3 py-1 rounded ${selected === 'condensed' ? 'bg-gray-100' : ''}`}>Condensed</button>
            <button onClick={() => setSelected('extended')} className={`px-3 py-1 rounded ${selected === 'extended' ? 'bg-gray-100' : ''}`}>Extended</button>
            <div className="ml-auto text-sm text-gray-500">{loading ? 'Generating…' : variants.length ? `${variants.length} options ready` : 'No options yet'}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {variants.length === 0 && !loading && (
              <div className="col-span-3 text-sm text-gray-500">No suggestions available. Try a different format.</div>
            )}

            {variants.map((v) => (
              <div key={v.type} className={`border rounded p-3 h-44 overflow-auto ${selected === v.type ? 'ring-2 ring-purple-300' : ''}`}>
                <div className="text-xs text-gray-500 capitalize mb-2">{v.type}</div>
                <div className="text-sm whitespace-pre-wrap mb-3">{v.text}</div>
                <div className="mt-auto flex gap-2">
                  <Button size="sm" onClick={() => onApply(v.text)}>Apply</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard?.writeText(v.text)
                    alert('Copied to clipboard')
                  }}>Copy</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
