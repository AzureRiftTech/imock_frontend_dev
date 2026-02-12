'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { api } from '@/lib/api'

export type Notification = {
  id: string
  type: 'interview' | 'achievement' | 'reminder' | 'performance'
  title: string
  message: string
  timestamp: Date
  read: boolean
  icon?: string
  actionUrl?: string
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const generateNotifications = async () => {
    if (!user) return

    try {
      const res = await api.get('/users/me/dashboard')
      const dashData = res.data
      const newNotifications: Notification[] = []

      // Completed interviews achievement
      if (dashData?.completed_count > 0) {
        newNotifications.push({
          id: 'completed-interviews',
          type: 'achievement',
          title: 'Interview Progress',
          message: `You've completed ${dashData.completed_count} interview${dashData.completed_count > 1 ? 's' : ''}! Keep up the great work! 🎉`,
          timestamp: new Date(),
          read: false,
          icon: '✅',
        })
      }

      // Performance comparison
      if (dashData?.avg_overall_score !== null && dashData?.avg_overall_score !== undefined) {
        const avgScore = dashData.avg_overall_score
        let performanceMsg = ''
        if (avgScore >= 80) {
          performanceMsg = `Outstanding! Your average score of ${avgScore}% puts you in the top tier! 🌟`
        } else if (avgScore >= 60) {
          performanceMsg = `Good progress! Your average score is ${avgScore}%. Keep improving! 📈`
        } else if (avgScore > 0) {
          performanceMsg = `You're on your way! Current average: ${avgScore}%. Practice makes perfect! 💪`
        }
        
        if (performanceMsg) {
          newNotifications.push({
            id: 'performance-score',
            type: 'performance',
            title: 'Performance Update',
            message: performanceMsg,
            timestamp: new Date(),
            read: false,
            icon: '📊',
          })
        }
      }

      // Upcoming interviews
      if (dashData?.upcomingInterviews && dashData.upcomingInterviews.length > 0) {
        ;(dashData.upcomingInterviews.slice(0, 3) as Array<Record<string, unknown>>).forEach((interview, index: number) => {
          const sched = (interview as Record<string, unknown>)?.scheduled_at
          if (!sched || typeof sched !== 'string') return
          const scheduledDate = new Date(sched)
          const now = new Date()
          const hoursUntil = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60))
          const daysUntil = Math.floor(hoursUntil / 24)

          let timeMsg = ''
          if (hoursUntil < 24) {
            timeMsg = hoursUntil < 1 ? 'in less than an hour' : `in ${hoursUntil} hours`
          } else {
            timeMsg = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
          }

          const id = (interview as Record<string, unknown>)?.interview_id as string | undefined
          const company = (interview as Record<string, unknown>)?.company_name as string | undefined
          const position = (interview as Record<string, unknown>)?.position_name as string | undefined || (interview as Record<string, unknown>)?.position as string | undefined

          if (!id) return

          newNotifications.push({
            id: `upcoming-${id}`,
            type: 'interview',
            title: 'Upcoming Interview',
            message: `${company || ''} - ${position || ''} ${timeMsg} 📅`,
            timestamp: scheduledDate,
            read: false,
            icon: '🎯',
            actionUrl: `/mock-interview/${id}`,
          })
        })
      }

      // Credit status
      if (dashData?.credits && dashData.credits.current_credits !== undefined) {
        if (dashData.credits.current_credits <= 5 && dashData.credits.current_credits > 0) {
          newNotifications.push({
            id: 'low-credits',
            type: 'reminder',
            title: 'Low Credits',
            message: `You have ${dashData.credits.current_credits} credit${dashData.credits.current_credits > 1 ? 's' : ''} remaining. Consider purchasing more! 💳`,
            timestamp: new Date(),
            read: false,
            icon: '⚠️',
            actionUrl: '/subscriptions',
          })
        }
      }

      // Latest result feedback
      if (dashData?.pastInterviews && dashData.pastInterviews.length > 0) {
        const latest = dashData.pastInterviews[0]
        if (latest.overall_score !== undefined && latest.overall_score !== null) {
          newNotifications.push({
            id: 'latest-result',
            type: 'achievement',
            title: 'Latest Interview Result',
            message: `You scored ${latest.overall_score}% in your recent ${latest.company_name || ''} interview! 🎯`,
            timestamp: new Date(latest.result_created_at || Date.now()),
            read: false,
            icon: '📝',
          })
        }
      }

      setNotifications(newNotifications)
    } catch (error) {
      console.error('Failed to generate notifications:', error)
    }
  }

  useEffect(() => {
    if (user) {
      generateNotifications()
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const refreshNotifications = () => {
    generateNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
