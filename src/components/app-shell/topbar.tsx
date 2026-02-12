'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { useNotifications } from '@/context/notification-context'
import { MdAccountCircle, MdKeyboardArrowDown } from 'react-icons/md'
import { IoMdNotificationsOutline } from 'react-icons/io'

export function Topbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  console.log(user)

  const [open, setOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)

  const handleNotificationClick = (notif: Record<string, unknown>) => {
    const id = (notif.id as number | string | undefined)
    const actionUrl = (notif.actionUrl as string | undefined)
    if (id !== undefined) markAsRead(String(id))
    if (actionUrl) router.push(actionUrl)
    setNotifOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white backdrop-blur border-b border-[#E0E0E0]">
      <div className="flex items-center justify-center sm:justify-between px-20 py-3">
        {/* <div className="text-sm text-zinc-600">Welcome back{user?.username ? `, ${user.username}` : ''}.</div> */}
        <div></div>
        <div className="relative">
          <div className='flex gap-0 sm:gap-5 items-center'>
            {/* Notification Icon with Badge */}
            <div className="relative cursor-pointer" onClick={() => setNotifOpen(!notifOpen)}>
              <IoMdNotificationsOutline color="#9F50E9" size={30} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto rounded-2xl border border-white/70 bg-white shadow-xl z-50">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAllAsRead()
                      }}
                      className="text-xs text-[#9F50E9] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No notifications yet</p>
                    <p className="text-xs mt-1">Check back later for updates!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-[#F7F4FF] hover:bg-[#F0EBFF]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl flex-shrink-0">{notif.icon || '📢'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="h-2 w-2 rounded-full bg-[#9F50E9] flex-shrink-0 ml-2"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{notif.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(notif.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className='border h-10 border-[#]'/>
            <div className='flex gap-3 items-center'>
              <div onClick={() => setOpen((v) => !v)} className='cursor-pointer'>
                <MdKeyboardArrowDown size={30} />
              </div>
              <div className='flex gap-2 items-center'>
                <MdAccountCircle size={40} />
                <p>{user?.username}</p>
              </div>
            </div>
          </div>



          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-xl backdrop-blur"
            >
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm text-zinc-800 hover:bg-white"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-zinc-800 hover:bg-white"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  logout()
                  router.push('/login')
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
