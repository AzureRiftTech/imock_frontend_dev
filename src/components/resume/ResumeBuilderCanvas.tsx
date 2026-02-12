'use client'

import * as React from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { jsPDF } from 'jspdf'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sweetAlert } from '@/lib/swal'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842

type ResumeBlock = {
  id: string
  type: 'text' | 'section'
  text: string
  x: number
  y: number
  width: number
  fontSize: number
  fontStyle?: 'normal' | 'bold'
  fill?: string
  align?: 'left' | 'center' | 'right'
}

type ResumeState = {
  templateId: 'classic' | 'modern' | 'minimal'
  blocks: ResumeBlock[]
}

type AutofillData = {
  headline?: string
  summary?: string
  skills?: string[]
  experience?: string[]
  education?: string[]
  certifications?: string[]
  projects?: string[]
}

type GitHubProject = {
  name: string
  html_url: string
  description?: string | null
  language?: string | null
}

const templates: Record<ResumeState['templateId'], ResumeState> = {
  classic: {
    templateId: 'classic',
    blocks: [
      { id: 'name', type: 'section', text: 'Full Name', x: 32, y: 32, width: 520, fontSize: 28, fontStyle: 'bold' },
      { id: 'headline', type: 'text', text: 'Professional Headline', x: 32, y: 70, width: 520, fontSize: 14, fill: '#4b5563' },
      { id: 'contact', type: 'text', text: 'Location · Phone · Email · LinkedIn · GitHub', x: 32, y: 92, width: 520, fontSize: 11, fill: '#6b7280' },
      { id: 'summary', type: 'section', text: 'SUMMARY\nWrite a short professional summary here.', x: 32, y: 130, width: 520, fontSize: 12 },
      { id: 'skills', type: 'section', text: 'SKILLS\nSkill 1 · Skill 2 · Skill 3', x: 32, y: 230, width: 520, fontSize: 12 },
      { id: 'experience', type: 'section', text: 'EXPERIENCE\nRole — Company (Year)\n• Achievement or responsibility', x: 32, y: 300, width: 520, fontSize: 12 },
      { id: 'education', type: 'section', text: 'EDUCATION\nDegree — School (Year)', x: 32, y: 430, width: 520, fontSize: 12 },
      { id: 'projects', type: 'section', text: 'PROJECTS\nProject Name — Short description', x: 32, y: 500, width: 520, fontSize: 12 },
      { id: 'certifications', type: 'section', text: 'CERTIFICATIONS\nCertification Name — Issuer', x: 32, y: 590, width: 520, fontSize: 12 },
    ],
  },
  modern: {
    templateId: 'modern',
    blocks: [
      { id: 'name', type: 'section', text: 'Full Name', x: 32, y: 32, width: 520, fontSize: 30, fontStyle: 'bold' },
      { id: 'headline', type: 'text', text: 'Professional Headline', x: 32, y: 72, width: 520, fontSize: 13, fill: '#2563eb' },
      { id: 'contact', type: 'text', text: 'Email · Phone · LinkedIn · GitHub', x: 32, y: 96, width: 520, fontSize: 11, fill: '#6b7280' },
      { id: 'summary', type: 'section', text: 'SUMMARY\nConcise impact-driven summary.', x: 32, y: 130, width: 520, fontSize: 12 },
      { id: 'skills', type: 'section', text: 'SKILLS\nSkill 1 · Skill 2 · Skill 3', x: 32, y: 220, width: 520, fontSize: 12 },
      { id: 'experience', type: 'section', text: 'EXPERIENCE\nRole — Company (Year)\n• Achievement or responsibility', x: 32, y: 290, width: 520, fontSize: 12 },
      { id: 'projects', type: 'section', text: 'PROJECTS\nProject Name — Short description', x: 32, y: 430, width: 520, fontSize: 12 },
      { id: 'education', type: 'section', text: 'EDUCATION\nDegree — School (Year)', x: 32, y: 510, width: 520, fontSize: 12 },
      { id: 'certifications', type: 'section', text: 'CERTIFICATIONS\nCertification Name — Issuer', x: 32, y: 590, width: 520, fontSize: 12 },
    ],
  },
  minimal: {
    templateId: 'minimal',
    blocks: [
      { id: 'name', type: 'section', text: 'Full Name', x: 32, y: 32, width: 520, fontSize: 26, fontStyle: 'bold' },
      { id: 'contact', type: 'text', text: 'Email · Phone · Location', x: 32, y: 68, width: 520, fontSize: 11, fill: '#6b7280' },
      { id: 'summary', type: 'section', text: 'SUMMARY\nAdd a short professional summary.', x: 32, y: 110, width: 520, fontSize: 12 },
      { id: 'skills', type: 'section', text: 'SKILLS\nSkill 1 · Skill 2 · Skill 3', x: 32, y: 200, width: 520, fontSize: 12 },
      { id: 'experience', type: 'section', text: 'EXPERIENCE\nRole — Company (Year)\n• Achievement or responsibility', x: 32, y: 270, width: 520, fontSize: 12 },
      { id: 'education', type: 'section', text: 'EDUCATION\nDegree — School (Year)', x: 32, y: 410, width: 520, fontSize: 12 },
      { id: 'projects', type: 'section', text: 'PROJECTS\nProject Name — Short description', x: 32, y: 480, width: 520, fontSize: 12 },
      { id: 'certifications', type: 'section', text: 'CERTIFICATIONS\nCertification Name — Issuer', x: 32, y: 560, width: 520, fontSize: 12 },
    ],
  },
}

function cloneTemplate(templateId: ResumeState['templateId']) {
  return {
    templateId,
    blocks: templates[templateId].blocks.map((b) => ({ ...b })),
  }
}

export function ResumeBuilderCanvas() {
  const [state, setState] = React.useState<ResumeState>(() => cloneTemplate('classic'))
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const stageRef = React.useRef<Konva.Stage | null>(null)

  React.useEffect(() => {
    const loadState = async () => {
      setLoading(true)
      try {
        const res = await api.get('/resume/builder')
        if (res.data?.state) {
          setState(res.data.state as ResumeState)
        }
      } catch (err) {
        setError('Failed to load resume builder state')
      } finally {
        setLoading(false)
      }
    }
    void loadState()
  }, [])

  const handleTemplateChange = (templateId: ResumeState['templateId']) => {
    setState(cloneTemplate(templateId))
    setSelectedId(null)
  }

  const addBlock = (type: ResumeBlock['type'], label: string) => {
    setState((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          id: `${type}-${Date.now()}`,
          type,
          text: label,
          x: 40,
          y: 650,
          width: 520,
          fontSize: 12,
        },
      ],
    }))
  }

  const updateBlock = (id: string, updates: Partial<ResumeBlock>) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  }

  const selectedBlock = state.blocks.find((b) => b.id === selectedId)

  const runAutofill = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/resume/autofill')
      const data = (res.data?.data || {}) as AutofillData
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.id === 'headline' && data.headline) {
            return { ...b, text: data.headline }
          }
          if (b.id === 'summary' && data.summary) {
            return { ...b, text: `SUMMARY\n${data.summary}` }
          }
          if (b.id === 'skills' && data.skills?.length) {
            return { ...b, text: `SKILLS\n${data.skills.join(' · ')}` }
          }
          if (b.id === 'experience' && data.experience?.length) {
            return { ...b, text: `EXPERIENCE\n${data.experience.join('\n')}` }
          }
          if (b.id === 'education' && data.education?.length) {
            return { ...b, text: `EDUCATION\n${data.education.join('\n')}` }
          }
          if (b.id === 'certifications' && data.certifications?.length) {
            return { ...b, text: `CERTIFICATIONS\n${data.certifications.join('\n')}` }
          }
          if (b.id === 'projects' && data.projects?.length) {
            return { ...b, text: `PROJECTS\n${data.projects.join('\n')}` }
          }
          return b
        }),
      }))
      await sweetAlert('Autofill complete', 'AI populated your resume sections.', 'success')
    } catch (err) {
      setError('Autofill failed')
    } finally {
      setLoading(false)
    }
  }

  const loadGithubProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/resume/github-projects')
      const projects = (res.data?.projects || []) as GitHubProject[]
      if (!projects.length) {
        await sweetAlert('No projects found', 'Connect GitHub in your profile first.', 'info')
        return
      }
      const formatted = projects.map((p) => `${p.name} — ${p.description || 'No description'} (${p.html_url})`)
      updateBlock('projects', { text: `PROJECTS\n${formatted.join('\n')}` })
    } catch (err) {
      setError('Failed to load GitHub projects')
    } finally {
      setLoading(false)
    }
  }

  const saveState = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.post('/resume/builder', { state })
      await sweetAlert('Saved', 'Your resume layout was saved.', 'success')
    } catch (err) {
      setError('Failed to save resume builder state')
    } finally {
      setSaving(false)
    }
  }

  const exportPdf = async () => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
    const pdf = new jsPDF('p', 'pt', [PAGE_WIDTH, PAGE_HEIGHT])
    pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    pdf.save('resume.pdf')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="bg-white/70">
        <CardHeader>
          <CardTitle className="text-base">Builder Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div> : null}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700">Template</label>
            <select
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={state.templateId}
              onChange={(e) => handleTemplateChange(e.target.value as ResumeState['templateId'])}
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700">Add Blocks</label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => addBlock('text', 'New text block')}>Text</Button>
              <Button type="button" variant="secondary" onClick={() => addBlock('section', 'NEW SECTION\nAdd content')}>Section</Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700">Actions</label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={runAutofill} disabled={loading}>AI Autofill</Button>
              <Button variant="secondary" onClick={loadGithubProjects} disabled={loading}>GitHub Projects</Button>
              <Button variant="secondary" onClick={saveState} disabled={saving}>Save</Button>
              <Button variant="secondary" onClick={exportPdf}>Export PDF</Button>
            </div>
          </div>

          {selectedBlock ? (
            <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold text-zinc-700">Selected Block</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-zinc-200 p-2 text-xs"
                value={selectedBlock.text}
                onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
              />
              <div className="flex items-center gap-2 text-xs">
                <span>Font size</span>
                <input
                  type="range"
                  min={10}
                  max={30}
                  value={selectedBlock.fontSize}
                  onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">Click a block on the canvas to edit.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/70">
        <CardHeader>
          <CardTitle className="text-base">Resume Canvas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="overflow-auto rounded-xl border border-zinc-200 bg-white p-4">
            <Stage
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              ref={stageRef}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null)
                }
              }}
            >
              <Layer>
                <Rect x={0} y={0} width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="#ffffff" />
                {state.blocks.map((block) => (
                  <Text
                    key={block.id}
                    text={block.text}
                    x={block.x}
                    y={block.y}
                    width={block.width}
                    fontSize={block.fontSize}
                    fontStyle={block.fontStyle || 'normal'}
                    fill={block.fill || '#111827'}
                    align={block.align || 'left'}
                    draggable
                    onClick={() => setSelectedId(block.id)}
                    onTap={() => setSelectedId(block.id)}
                    onDragEnd={(e) => updateBlock(block.id, { x: e.target.x(), y: e.target.y() })}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
