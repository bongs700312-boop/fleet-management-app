'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Car, User, CheckCircle, Clock, XCircle, RotateCcw, Calendar } from 'lucide-react'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [currentDate])

  async function fetchBookings() {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      // Get first and last day of the month
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles (
            make,
            model,
            year,
            license_plate
          )
        `)
        .gte('start_date', firstDay.toISOString().split('T')[0])
        .lte('start_date', lastDay.toISOString().split('T')[0])
        .order('start_date', { ascending: true })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startDayOfWeek }
  }

  function getBookingsForDay(day: number) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter(b => b.start_date === dateStr)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'approved':
        return <CheckCircle size={14} />
      case 'pending':
        return <Clock size={14} />
      case 'rejected':
        return <XCircle size={14} />
      case 'in_progress':
        return <Car size={14} />
      case 'completed':
        return <RotateCcw size={14} />
      default:
        return <Clock size={14} />
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'pending':
        return 'Unapproved'
      case 'rejected':
        return 'Rejected'
      case 'in_progress':
        return 'Checked Out'
      case 'completed':
        return 'Returned'
      default:
        return status
    }
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentDate)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
        <p className="text-gray-600 mt-2">View all bookings by month</p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Unapproved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Checked Out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm text-gray-600">Returned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayBookings = getBookingsForDay(day)
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

            return (
              <div
                key={day}
                className={`h-24 border rounded-lg p-2 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => dayBookings.length > 0 && setSelectedBooking(dayBookings[0])}
              >
                <div className={`font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(booking.status)}`}
                    >
                      {booking.vehicles?.license_plate}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Car size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium">
                    {selectedBooking.vehicles?.year} {selectedBooking.vehicles?.make} {selectedBooking.vehicles?.model}
                  </p>
                  <p className="text-sm text-gray-500">{selectedBooking.vehicles?.license_plate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-medium">{selectedBooking.user_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-medium">
                    {new Date(selectedBooking.start_date).toLocaleDateString()} at {(selectedBooking as any).start_time || '09:00'} - {new Date(selectedBooking.end_date).toLocaleDateString()} at {(selectedBooking as any).end_time || '17:00'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(selectedBooking.status)}`}>
                {getStatusIcon(selectedBooking.status)}
                <span className="font-medium">{getStatusLabel(selectedBooking.status)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
