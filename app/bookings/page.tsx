'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Calendar, CheckCircle, XCircle, AlertCircle, Car, Mail, Filter, User, FileText } from 'lucide-react'
import { useRequireAdmin } from '@/lib/auth'

type Booking = Database['public']['Tables']['bookings']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function BookingsPage() {
  const { user, loading: authLoading } = useRequireAdmin()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [filter])

  async function fetchBookings() {
    try {
      const [bookingsResponse, vehiclesResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*')
      ])

      if (bookingsResponse.error) throw bookingsResponse.error
      if (vehiclesResponse.error) throw vehiclesResponse.error

      let filteredBookings = bookingsResponse.data || []
      if (filter !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.status === filter)
      }

      setBookings(filteredBookings)
      setVehicles(vehiclesResponse.data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setMessage({ type: 'error', text: 'Failed to load bookings. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(bookingId: string) {
    setProcessing(bookingId)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', bookingId)

      if (error) throw error

      // Send approval email
      const booking = bookings.find(b => b.id === bookingId)
      const vehicle = vehicles.find(v => v.id === booking?.vehicle_id)

      if (booking && vehicle) {
        await fetch('/api/email/booking-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking,
            vehicle,
            status: 'approved'
          })
        })
      }

      setMessage({ type: 'success', text: 'Booking approved successfully. Notification sent to staff member.' })
      fetchBookings()
    } catch (error) {
      console.error('Error approving booking:', error)
      setMessage({ type: 'error', text: 'Failed to approve booking. Please try again.' })
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(bookingId: string) {
    setProcessing(bookingId)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId)

      if (error) throw error

      // Send rejection email
      const booking = bookings.find(b => b.id === bookingId)
      const vehicle = vehicles.find(v => v.id === booking?.vehicle_id)

      if (booking && vehicle) {
        await fetch('/api/email/booking-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking,
            vehicle,
            status: 'rejected'
          })
        })
      }

      setMessage({ type: 'success', text: 'Booking rejected successfully. Notification sent to staff member.' })
      fetchBookings()
    } catch (error) {
      console.error('Error rejecting booking:', error)
      setMessage({ type: 'error', text: 'Failed to reject booking. Please try again.' })
    } finally {
      setProcessing(null)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending': return <AlertCircle size={16} />
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'in_progress': return <Calendar size={16} />
      case 'completed': return <CheckCircle size={16} />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-2">Review and manage vehicle booking requests</p>
      </div>

      {/* Summary Card */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <p className="font-semibold text-yellow-800">{pendingCount} Pending Booking{pendingCount > 1 ? 's' : ''}</p>
            <p className="text-sm text-yellow-700">Action required: Review and approve or reject booking requests</p>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Approved ({bookings.filter(b => b.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'in_progress' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          In Progress ({bookings.filter(b => b.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed ({bookings.filter(b => b.status === 'completed').length})
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Booking Requests</h2>
        </div>
        
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No bookings found.
          </div>
        ) : (
          <div className="divide-y">
            {bookings.map((booking) => {
              const vehicle = vehicles.find(v => v.id === booking.vehicle_id)
              return (
                <div key={booking.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Car size={18} className="text-gray-400" />
                          <span className="font-medium">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'}
                          </span>
                          {vehicle && (
                            <span className="text-gray-500">- {vehicle.license_plate}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail size={18} className="text-gray-400" />
                          <span className="text-gray-700">{booking.user_email}</span>
                        </div>

                        {(booking as any).driver_name && (
                          <div className="flex items-center gap-2">
                            <User size={18} className="text-gray-400" />
                            <span className="text-gray-700">Driver: {(booking as any).driver_name}</span>
                          </div>
                        )}

                        {(booking as any).number_of_passengers && (
                          <div className="flex items-center gap-2">
                            <User size={18} className="text-gray-400" />
                            <span className="text-gray-700">Passengers: {(booking as any).number_of_passengers}</span>
                          </div>
                        )}

                        {(booking as any).trip_description && (
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-gray-400" />
                            <span className="text-gray-700 text-sm">{(booking as any).trip_description}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                          </div>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{new Date(booking.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Pending Bookings */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(booking.id)}
                          disabled={processing === booking.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {processing === booking.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          disabled={processing === booking.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {processing === booking.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle size={18} />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}