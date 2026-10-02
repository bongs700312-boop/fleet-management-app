'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardCheck, 
  Car, 
  DollarSign, 
  Droplets, 
  FileText,
  Calendar as CalendarIcon,
  Calendar,
  Mail,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Book a Vehicle', href: '/rules-booking', icon: BookOpen },
  { name: 'My Pending Bookings', href: '/my-bookings', icon: Mail },
  { name: 'Booking Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Booking Management', href: '/bookings', icon: Calendar },
  { name: 'Check-In/out Inspections', href: '/inspections', icon: ClipboardCheck },
  { name: 'Vehicles & Services', href: '/vehicles', icon: Car },
  { name: 'Fines', href: '/fines', icon: DollarSign },
  { name: 'Carwash', href: '/carwash', icon: Droplets },
  { name: 'Executive Reports', href: '/reports', icon: FileText },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Fleet Management</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-sm text-gray-500">© 2026 Fleet Management</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
