'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { MdAccountCircle, MdKeyboardArrowDown } from 'react-icons/md'
import { IoMdNotificationsOutline } from 'react-icons/io'

export function Topbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  console.log(user)

  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white backdrop-blur border-b border-[#E0E0E0]">
      <div className="flex items-center justify-between px-20 py-3">
        {/* <div className="text-sm text-zinc-600">Welcome back{user?.username ? `, ${user.username}` : ''}.</div> */}
        <div></div>
        <div className="relative">
          <div className='flex gap-5 items-center'>
            <IoMdNotificationsOutline color="#9F50E9" size={30} />
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
