'use client'

import React, { useState, useEffect } from 'react'
import { Stage, Layer, Text, Rect } from 'react-konva'
import { Sparkles, Plus, Trash2, Save, Download, Layout as LayoutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import jsPDF from 'jspdf'
import SuggestionPanel from './SuggestionPanel'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333'

interface Experience {
  id: string
  company: string
  jobTitle: string
  date: string
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  gpa: string
  date: string
  additionalInfo: string
}

interface Project {
  id: string
  name: string
  link: string
  date: string
  description: string
}

interface ResumeData {
  name: string
  location: string
  phone: string
  email: string
  website: string
  objective: string
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  skills: string
  featuredSkills: Array<{ name: string; level: number }>
}

export default function ResumeBuilderFormV2() {
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    objective: '',
    experiences: [{ id: '1', company: '', jobTitle: '', date: '', description: '' }],
    education: [{ id: '1', school: '', degree: '', gpa: '', date: '', additionalInfo: '' }],
    projects: [{ id: '1', name: '', link: '', date: '', description: '' }],
    skills: '',
    featuredSkills: [
      { name: '', level: 3 },
      { name: '', level: 3 },
      { name: '', level: 3 },
    ],
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [layout, setLayout] = useState<'classic' | 'modern' | 'professional'>('classic')

  // Suggestions modal state
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionField, setSuggestionField] = useState<string>('')
  const [suggestionIndex, setSuggestionIndex] = useState<number | undefined>(undefined)
  const [suggestionExisting, setSuggestionExisting] = useState<string | undefined>(undefined)
  const [suggestionContext, setSuggestionContext] = useState<any>(undefined)

  // Load saved state on mount
  useEffect(() => {
    loadState()
  }, [])

  const loadState = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/resume/builder`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data.state) {
        setResumeData(response.data.state)
      }
    } catch (error) {
      console.error('Failed to load resume state:', error)
    }
  }

  const saveState = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_BASE_URL}/resume/builder`,
        { state: resumeData },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Resume saved successfully!')
    } catch (error) {
      console.error('Failed to save resume:', error)
      alert('Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  const generateField = async (fieldName: string, sectionType?: string, index?: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/resume/autofill`,
        { fieldName, sectionType, index },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = response.data
      
      // Update the specific field with AI-generated content
      if (fieldName === 'objective' && data.summary) {
        setResumeData(prev => ({ ...prev, objective: data.summary }))
      } else if (fieldName === 'skills' && data.skills) {
        setResumeData(prev => ({ ...prev, skills: data.skills.join(', ') }))
      } else if (sectionType === 'experience' && data.experience && data.experience[0]) {
        const exp = data.experience[0].split('\n')[0]
        setResumeData(prev => {
          const newExperiences = [...prev.experiences]
          if (index !== undefined && newExperiences[index]) {
            newExperiences[index].description = exp
          }
          return { ...prev, experiences: newExperiences }
        })
      } else if (sectionType === 'education' && data.education && data.education[0]) {
        const edu = data.education[0]
        setResumeData(prev => {
          const newEducation = [...prev.education]
          if (index !== undefined && newEducation[index]) {
            newEducation[index].additionalInfo = edu
          }
          return { ...prev, education: newEducation }
        })
      } else if (sectionType === 'project' && data.projects && data.projects[0]) {
        const proj = data.projects[0]
        setResumeData(prev => {
          const newProjects = [...prev.projects]
          if (index !== undefined && newProjects[index]) {
            newProjects[index].description = proj
          }
          return { ...prev, projects: newProjects }
        })
      }
    } catch (error) {
      console.error('Failed to generate content:', error)
      alert('Failed to generate AI content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Open suggestions modal for a field
  const openSuggestions = (field: string, index?: number) => {
    let existing = ''
    if (field === 'skills') existing = resumeData.skills
    else if (field === 'objective') existing = resumeData.objective
    else if (field === 'experience') existing = resumeData.experiences?.[index || 0]?.description || ''
    else if (field === 'education') existing = resumeData.education?.[index || 0]?.additionalInfo || ''
    else if (field === 'project') existing = resumeData.projects?.[index || 0]?.description || ''

    setSuggestionField(field)
    setSuggestionIndex(index)
    setSuggestionExisting(existing)

    // attach field-specific object context for better placeholder filling
    if (field === 'experience') setSuggestionContext(resumeData.experiences?.[index || 0] || undefined)
    else if (field === 'education') setSuggestionContext(resumeData.education?.[index || 0] || undefined)
    else if (field === 'project') setSuggestionContext(resumeData.projects?.[index || 0] || undefined)
    else setSuggestionContext(undefined)

    setSuggestionsOpen(true)
  }

  const applySuggestion = (text: string) => {
    const field = suggestionField
    const index = suggestionIndex
    if (field === 'skills') setResumeData(prev => ({ ...prev, skills: text }))
    else if (field === 'objective') setResumeData(prev => ({ ...prev, objective: text }))
    else if (field === 'experience' && typeof index === 'number') {
      setResumeData(prev => {
        const newExperiences = [...prev.experiences]
        if (newExperiences[index]) newExperiences[index].description = text
        return { ...prev, experiences: newExperiences }
      })
    } else if (field === 'education' && typeof index === 'number') {
      setResumeData(prev => {
        const newEducation = [...prev.education]
        if (newEducation[index]) newEducation[index].additionalInfo = text
        return { ...prev, education: newEducation }
      })
    } else if (field === 'project' && typeof index === 'number') {
      setResumeData(prev => {
        const newProjects = [...prev.projects]
        if (newProjects[index]) newProjects[index].description = text
        return { ...prev, projects: newProjects }
      })
    }

    setSuggestionsOpen(false)
  }

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: Date.now().toString(), company: '', jobTitle: '', date: '', description: '' }],
    }))
  }

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id),
    }))
  }

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), school: '', degree: '', gpa: '', date: '', additionalInfo: '' }],
    }))
  }

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }))
  }

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), name: '', link: '', date: '', description: '' }],
    }))
  }

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id),
    }))
  }

  const exportPdf = () => {
    const pdf = new jsPDF('p', 'pt', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    let yPos = 40

    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(resumeData.name || 'Resume', pageWidth / 2, yPos, { align: 'center' })
    yPos += 30

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const contact = [resumeData.location, resumeData.phone, resumeData.email].filter(Boolean).join(' • ')
    pdf.text(contact, pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    if (resumeData.website) {
      pdf.text(resumeData.website, pageWidth / 2, yPos, { align: 'center' })
      yPos += 25
    } else {
      yPos += 15
    }

    if (resumeData.objective) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Objective', 40, yPos)
      yPos += 15
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(resumeData.objective, pageWidth - 80)
      pdf.text(lines, 40, yPos)
      yPos += lines.length * 12 + 15
    }

    if (resumeData.experiences.some(exp => exp.company || exp.jobTitle)) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Work Experience', 40, yPos)
      yPos += 15

      resumeData.experiences.forEach(exp => {
        if (exp.company || exp.jobTitle) {
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.text(exp.company, 40, yPos)
          pdf.setFont('helvetica', 'normal')
          pdf.text(exp.date, pageWidth - 40, yPos, { align: 'right' })
          yPos += 12
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'italic')
          pdf.text(exp.jobTitle, 40, yPos)
          yPos += 12

          if (exp.description) {
            pdf.setFont('helvetica', 'normal')
            const lines = pdf.splitTextToSize(exp.description, pageWidth - 80)
            pdf.text(lines, 40, yPos)
            yPos += lines.length * 12 + 8
          }
        }
      })
      yPos += 10
    }

    if (resumeData.education.some(edu => edu.school || edu.degree)) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Education', 40, yPos)
      yPos += 15

      resumeData.education.forEach(edu => {
        if (edu.school || edu.degree) {
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.text(edu.school, 40, yPos)
          pdf.setFont('helvetica', 'normal')
          pdf.text(edu.date, pageWidth - 40, yPos, { align: 'right' })
          yPos += 12

          pdf.setFontSize(10)
          pdf.text(`${edu.degree}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`, 40, yPos)
          yPos += 12

          if (edu.additionalInfo) {
            const lines = pdf.splitTextToSize(edu.additionalInfo, pageWidth - 80)
            pdf.text(lines, 40, yPos)
            yPos += lines.length * 12 + 8
          }
        }
      })
      yPos += 10
    }

    if (resumeData.projects.some(proj => proj.name)) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Projects', 40, yPos)
      yPos += 15

      resumeData.projects.forEach(proj => {
        if (proj.name) {
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.text(proj.name, 40, yPos)
          pdf.setFont('helvetica', 'normal')
          pdf.text(proj.date, pageWidth - 40, yPos, { align: 'right' })
          yPos += 12

          if (proj.link) {
            pdf.setFontSize(9)
            pdf.setTextColor(0, 0, 255)
            pdf.text(proj.link, 40, yPos)
            pdf.setTextColor(0, 0, 0)
            yPos += 12
          }

          if (proj.description) {
            pdf.setFontSize(10)
            const lines = pdf.splitTextToSize(proj.description, pageWidth - 80)
            pdf.text(lines, 40, yPos)
            yPos += lines.length * 12 + 8
          }
        }
      })
      yPos += 10
    }

    if (resumeData.skills) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Skills', 40, yPos)
      yPos += 15
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(resumeData.skills, pageWidth - 80)
      pdf.text(lines, 40, yPos)
    }

    pdf.save('resume.pdf')
  }

  const renderCanvas = () => {
    return (
      <Stage width={600} height={850}>
        <Layer>
          <Rect x={0} y={0} width={600} height={850} fill="#ffffff" />

          {/* Layout-specific styling */}
          {layout === 'classic' && (
            <>
              <Rect x={40} y={60} width={520} height={2} fill="#EF4444" />
              <Rect x={40} y={75} width={520} height={2} fill="#EF4444" />
              <Rect x={40} y={90} width={520} height={2} fill="#EF4444" />
              <Rect x={40} y={105} width={520} height={2} fill="#EF4444" />
              <Rect x={40} y={120} width={520} height={2} fill="#EF4444" />
              <Rect x={40} y={135} width={520} height={2} fill="#EF4444" />
            </>
          )}
          
          {layout === 'modern' && (
            <>
              <Rect x={0} y={0} width={600} height={125} fill="#F3F4F6" />
              <Rect x={0} y={125} width={600} height={4} fill="#6366F1" />
            </>
          )}
          
          {layout === 'professional' && (
            <>
              <Rect x={0} y={0} width={180} height={850} fill="#1F2937" />
              <Rect x={180} y={0} width={5} height={850} fill="#D97706" />
            </>
          )}

          {/* Name */}
          {layout === 'professional' ? (
            <Text
              x={20}
              y={40}
              text={resumeData.name || 'Your Name'}
              fontSize={18}
              fontStyle="bold"
              fill="#FFFFFF"
              width={140}
              align="center"
            />
          ) : (
            <Text
              x={40}
              y={layout === 'modern' ? 40 : 30}
              text={resumeData.name || 'Your Name'}
              fontSize={layout === 'modern' ? 28 : 24}
              fontStyle="bold"
              fill={layout === 'modern' ? '#1F2937' : '#000000'}
            />
          )}

          {/* Contact Info */}
          {layout === 'professional' ? (
            <>
              <Text x={20} y={80} text={resumeData.email || 'email@example.com'} fontSize={8} fill="#D1D5DB" width={140} align="center" />
              <Text x={20} y={95} text={resumeData.phone || 'Phone'} fontSize={8} fill="#D1D5DB" width={140} align="center" />
              <Text x={20} y={110} text={resumeData.location || 'Location'} fontSize={8} fill="#D1D5DB" width={140} align="center" />
            </>
          ) : (
            <>
              <Text
                x={40}
                y={layout === 'modern' ? 85 : 150}
                text={[resumeData.location, resumeData.phone, resumeData.email].filter(Boolean).join(' • ') || 'Contact Info'}
                fontSize={9}
                fill={layout === 'modern' ? '#4B5563' : '#666666'}
                width={520}
              />
              {resumeData.website && (
                <Text x={40} y={layout === 'modern' ? 100 : 165} text={resumeData.website} fontSize={9} fill={layout === 'modern' ? '#4B5563' : '#666666'} />
              )}
            </>
          )}

          {/* Objective */}
          {resumeData.objective && (
            <>
              {layout === 'professional' ? (
                <>
                  <Text x={20} y={140} text="OBJECTIVE" fontSize={10} fontStyle="bold" fill="#D97706" width={140} />
                  <Text x={20} y={160} text={resumeData.objective} fontSize={8} fill="#E5E7EB" width={140} />
                </>
              ) : (
                <>
                  <Text 
                    x={40} 
                    y={layout === 'modern' ? 145 : 190} 
                    text="OBJECTIVE" 
                    fontSize={12} 
                    fontStyle="bold" 
                    fill={layout === 'modern' ? '#6366F1' : '#EF4444'} 
                  />
                  <Text x={40} y={layout === 'modern' ? 165 : 210} text={resumeData.objective} fontSize={9} fill="#000000" width={520} />
                </>
              )}
            </>
          )}

          {/* Work Experience */}
          <Text 
            x={layout === 'professional' ? 200 : 40} 
            y={layout === 'professional' ? 40 : (resumeData.objective ? (layout === 'modern' ? 240 : 270) : (layout === 'modern' ? 160 : 210))} 
            text="WORK EXPERIENCE" 
            fontSize={12} 
            fontStyle="bold" 
            fill={layout === 'professional' ? '#D97706' : (layout === 'modern' ? '#6366F1' : '#EF4444')} 
          />
          
          {resumeData.experiences.map((exp, index) => {
            const baseY = layout === 'professional' ? 60 : (resumeData.objective ? (layout === 'modern' ? 260 : 290) : (layout === 'modern' ? 180 : 230))
            const yStart = baseY + index * 70
            const xStart = layout === 'professional' ? 200 : 40
            const textWidth = layout === 'professional' ? 380 : 520
            return exp.company ? (
              <React.Fragment key={exp.id}>
                <Text x={xStart} y={yStart} text={exp.company} fontSize={11} fontStyle="bold" fill={layout === 'professional' ? '#1F2937' : '#000000'} />
                <Text x={layout === 'professional' ? 560 : 520} y={yStart} text={exp.date} fontSize={9} fill="#666666" align="right" />
                <Text x={xStart} y={yStart + 15} text={exp.jobTitle} fontSize={10} fontStyle="italic" fill={layout === 'professional' ? '#4B5563' : '#000000'} />
                {exp.description && (
                  <Text x={xStart} y={yStart + 30} text={exp.description} fontSize={9} fill={layout === 'professional' ? '#374151' : '#000000'} width={textWidth} />
                )}
              </React.Fragment>
            ) : null
          })}

          {/* Education */}
          {layout === 'professional' ? (
            <Text x={20} y={250} text="EDUCATION" fontSize={10} fontStyle="bold" fill="#D97706" width={140} />
          ) : (
            <Text
              x={40}
              y={resumeData.objective ? (layout === 'modern' ? 400 : 420) : (layout === 'modern' ? 320 : 350)}
              text="EDUCATION"
              fontSize={12}
              fontStyle="bold"
              fill={layout === 'modern' ? '#6366F1' : '#EF4444'}
            />
          )}
          
          {resumeData.education.map((edu, index) => {
            const baseY = layout === 'professional' ? 270 : (resumeData.objective ? (layout === 'modern' ? 420 : 440) : (layout === 'modern' ? 340 : 370))
            const yStart = baseY + index * 60
            const xStart = layout === 'professional' ? 20 : 40
            const textWidth = layout === 'professional' ? 140 : 520
            return edu.school ? (
              <React.Fragment key={edu.id}>
                <Text x={xStart} y={yStart} text={edu.school} fontSize={layout === 'professional' ? 9 : 11} fontStyle="bold" fill={layout === 'professional' ? '#FFFFFF' : '#000000'} width={layout === 'professional' ? textWidth : undefined} />
                {layout !== 'professional' && <Text x={520} y={yStart} text={edu.date} fontSize={9} fill="#666666" align="right" />}
                {layout === 'professional' && <Text x={xStart} y={yStart + 12} text={edu.date} fontSize={7} fill="#9CA3AF" width={textWidth} />}
                <Text
                  x={xStart}
                  y={yStart + (layout === 'professional' ? 24 : 15)}
                  text={`${edu.degree}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`}
                  fontSize={layout === 'professional' ? 8 : 10}
                  fill={layout === 'professional' ? '#D1D5DB' : '#000000'}
                  width={textWidth}
                />
              </React.Fragment>
            ) : null
          })}

          {/* Projects */}
          {layout === 'professional' ? (
            <Text x={20} y={400} text="PROJECTS" fontSize={10} fontStyle="bold" fill="#D97706" width={140} />
          ) : (
            <Text x={40} y={layout === 'modern' ? 550 : 580} text="PROJECTS" fontSize={12} fontStyle="bold" fill={layout === 'modern' ? '#6366F1' : '#EF4444'} />
          )}
          
          {resumeData.projects.map((proj, index) => {
            const baseY = layout === 'professional' ? 420 : (layout === 'modern' ? 570 : 600)
            const yStart = baseY + index * 55
            const xStart = layout === 'professional' ? 20 : 40
            const textWidth = layout === 'professional' ? 140 : 520
            return proj.name ? (
              <React.Fragment key={proj.id}>
                <Text x={xStart} y={yStart} text={proj.name} fontSize={layout === 'professional' ? 9 : 11} fontStyle="bold" fill={layout === 'professional' ? '#FFFFFF' : '#000000'} width={layout === 'professional' ? textWidth : undefined} />
                {layout !== 'professional' && <Text x={520} y={yStart} text={proj.date} fontSize={9} fill="#666666" align="right" />}
                {layout === 'professional' && proj.date && <Text x={xStart} y={yStart + 12} text={proj.date} fontSize={7} fill="#9CA3AF" width={textWidth} />}
                {proj.description && (
                  <Text
                    x={xStart}
                    y={yStart + (layout === 'professional' ? 24 : 15)}
                    text={proj.description}
                    fontSize={layout === 'professional' ? 7 : 9}
                    fill={layout === 'professional' ? '#D1D5DB' : '#000000'}
                    width={textWidth}
                  />
                )}
              </React.Fragment>
            ) : null
          })}

          {/* Skills */}
          {resumeData.skills && (
            <>
              {layout === 'professional' ? (
                <>
                  <Text x={20} y={550} text="SKILLS" fontSize={10} fontStyle="bold" fill="#D97706" width={140} />
                  <Text x={20} y={570} text={resumeData.skills} fontSize={8} fill="#E5E7EB" width={140} />
                </>
              ) : (
                <>
                  <Text x={40} y={layout === 'modern' ? 700 : 730} text="SKILLS" fontSize={12} fontStyle="bold" fill={layout === 'modern' ? '#6366F1' : '#EF4444'} />
                  <Text x={40} y={layout === 'modern' ? 720 : 750} text={resumeData.skills} fontSize={9} fill="#000000" width={520} />
                </>
              )}
            </>
          )}
        </Layer>
      </Stage>
    )
  }

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-50">
      {/* Left Sidebar - Form */}
      <div className="w-1/2 overflow-y-auto bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">AI Resume Builder</h2>
          <div className="flex gap-2">
            <Button onClick={saveState} disabled={saving} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Data'}
            </Button>
            <Button onClick={exportPdf} size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Download className="w-4 h-4 mr-2" />
              Download Resume
            </Button>
          </div>
        </div>

        {/* Layout Selection */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
            <LayoutIcon className="w-5 h-5" />
            Resume Layout
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setLayout('classic')}
              className={`p-3 border-2 rounded-lg transition-all ${
                layout === 'classic'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="text-sm font-semibold">Classic</div>
              <div className="text-xs text-gray-600 mt-1">Traditional ATS-friendly</div>
            </button>
            <button
              onClick={() => setLayout('modern')}
              className={`p-3 border-2 rounded-lg transition-all ${
                layout === 'modern'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="text-sm font-semibold">Modern</div>
              <div className="text-xs text-gray-600 mt-1">Clean with color accents</div>
            </button>
            <button
              onClick={() => setLayout('professional')}
              className={`p-3 border-2 rounded-lg transition-all ${
                layout === 'professional'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="text-sm font-semibold">Professional</div>
              <div className="text-xs text-gray-600 mt-1">Executive sidebar style</div>
            </button>
          </div>
        </section>

        {/* Personal Information */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <input
                type="text"
                value={resumeData.name}
                onChange={(e) => setResumeData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Location</label>
              <input
                type="text"
                value={resumeData.location}
                onChange={(e) => setResumeData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input
                type="text"
                value={resumeData.phone}
                onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                value={resumeData.email}
                onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="mail@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Website</label>
            <input
              type="text"
              value={resumeData.website}
              onChange={(e) => setResumeData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Objective</label>
              <button
                onClick={() => openSuggestions('objective')}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                title="AI Suggestions"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={resumeData.objective}
              onChange={(e) => setResumeData(prev => ({ ...prev, objective: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              placeholder="AI superpower to assist candidates..."
            />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Work Experience</h3>

          {resumeData.experiences.map((exp, index) => (
            <div key={exp.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Experience #{index + 1}</span>
                {resumeData.experiences.length > 1 && (
                  <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => {
                    const newExps = [...resumeData.experiences]
                    newExps[index].company = e.target.value
                    setResumeData(prev => ({ ...prev, experiences: newExps }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Company Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const newExps = [...resumeData.experiences]
                      newExps[index].jobTitle = e.target.value
                      setResumeData(prev => ({ ...prev, experiences: newExps }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="text"
                    value={exp.date}
                    onChange={(e) => {
                      const newExps = [...resumeData.experiences]
                      newExps[index].date = e.target.value
                      setResumeData(prev => ({ ...prev, experiences: newExps }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="2024 - Present"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Description</label>
                  <button
                    onClick={() => openSuggestions('experience', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => {
                    const newExps = [...resumeData.experiences]
                    newExps[index].description = e.target.value
                    setResumeData(prev => ({ ...prev, experiences: newExps }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="• Bullet point description..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addExperience}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </section>

        {/* Education */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Education</h3>

          {resumeData.education.map((edu, index) => (
            <div key={edu.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Education #{index + 1}</span>
                {resumeData.education.length > 1 && (
                  <button onClick={() => removeEducation(edu.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">School</label>
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].school = e.target.value
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="University Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education]
                      newEdu[index].degree = e.target.value
                      setResumeData(prev => ({ ...prev, education: newEdu }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="BS Computer Science"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">GPA</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education]
                      newEdu[index].gpa = e.target.value
                      setResumeData(prev => ({ ...prev, education: newEdu }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="3.8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="text"
                  value={edu.date}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].date = e.target.value
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="2020 - 2024"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Additional Info</label>
                  <button
                    onClick={() => openSuggestions('education', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={edu.additionalInfo}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education]
                    newEdu[index].additionalInfo = e.target.value
                    setResumeData(prev => ({ ...prev, education: newEdu }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                  placeholder="Relevant coursework, honors..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addEducation}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </section>

        {/* Projects */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Projects</h3>

          {resumeData.projects.map((proj, index) => (
            <div key={proj.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Project #{index + 1}</span>
                {resumeData.projects.length > 1 && (
                  <button onClick={() => removeProject(proj.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">Project Name</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => {
                    const newProj = [...resumeData.projects]
                    newProj[index].name = e.target.value
                    setResumeData(prev => ({ ...prev, projects: newProj }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Project Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Link</label>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => {
                      const newProj = [...resumeData.projects]
                      newProj[index].link = e.target.value
                      setResumeData(prev => ({ ...prev, projects: newProj }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="text"
                    value={proj.date}
                    onChange={(e) => {
                      const newProj = [...resumeData.projects]
                      newProj[index].date = e.target.value
                      setResumeData(prev => ({ ...prev, projects: newProj }))
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Description</label>
                  <button
                    onClick={() => openSuggestions('project', index)}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={proj.description}
                  onChange={(e) => {
                    const newProj = [...resumeData.projects]
                    newProj[index].description = e.target.value
                    setResumeData(prev => ({ ...prev, projects: newProj }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                  placeholder="Project description..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={addProject}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Skills</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Skills List</label>
              <button
                onClick={() => openSuggestions('skills')}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                title="AI Suggestions"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={resumeData.skills}
              onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
              placeholder="JavaScript, React, Node.js, Python..."
            />
          </div>
        </section>
      </div>

      {/* Right Panel - Live Canvas Preview */}
      <div className="w-1/2 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">
          Live Preview - {layout === 'classic' ? 'Classic' : layout === 'modern' ? 'Modern' : 'Professional'} Layout
        </h3>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          {renderCanvas()}
        </div>
      </div>

      {/* Suggestion Panel Modal */}
      <SuggestionPanel
        open={suggestionsOpen}
        fieldName={suggestionField}
        existingValue={suggestionExisting}
        index={suggestionIndex}
        context={suggestionContext}
        onClose={() => setSuggestionsOpen(false)}
        onApply={applySuggestion}
      />
    </div>
  )
}
