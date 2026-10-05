'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Calendar, Mail, Edit, X, Car, CheckCircle, AlertTriangle } from 'lucide-react'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])

  const [editFormData, setEditFormData] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    driver_name: '',
    number_of_passengers: '',
    trip_description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  async function fetchMyBookings() {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*)')
        .eq('user_email', email)
        .in('status', ['pending'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])

      if (data && data.length === 0) {
        setMessage({ type: 'error', text: 'No pending bookings found for this email' })
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setMessage({ type: 'error', text: 'Failed to fetch bookings. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateBooking() {
    if (!editingBooking) return

    setLoading(true)
    setMessage(null)

    try {
      // Check for booking conflicts
      const { data: existingBookings, error: queryError } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', editFormData.vehicle_id)
        .in('status', ['pending', 'approved', 'in_progress'])

      if (queryError) throw queryError

      // Check for date and time overlap (excluding the current booking being edited)
      const requestedStart = new Date(`${editFormData.start_date}T${editFormData.start_time}`)
      const requestedEnd = new Date(`${editFormData.end_date}T${editFormData.end_time}`)

      if (existingBookings && existingBookings.length > 0) {
        for (const booking of existingBookings) {
          if (booking.id === editingBooking.id) continue // Skip current booking
          
          const bookingStart = new Date(`${booking.start_date}T${(booking as any).start_time || '09:00'}`)
          const bookingEnd = new Date(`${booking.end_date}T${(booking as any).end_time || '17:00'}`)

          if (requestedStart <= bookingEnd && requestedEnd >= bookingStart) {
            const formattedTime = bookingEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            const formattedDate = bookingEnd.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })

            setMessage({
              type: 'error',
              text: `Vehicle not available for these times. Available from ${formattedDate} at ${formattedTime}`
            })
            setLoading(false)
            return
          }
        }
      }

      // Update booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          vehicle_id: editFormData.vehicle_id,
          start_date: editFormData.start_date,
          end_date: editFormData.end_date,
          start_time: editFormData.start_time,
          end_time: editFormData.end_time,
          driver_name: editFormData.driver_name || null,
          number_of_passengers: editFormData.number_of_passengers ? parseInt(editFormData.number_of_passengers) : null,
          trip_description: editFormData.trip_description || null
        })
        .eq('id', editingBooking.id)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Booking updated successfully!' })
      setEditingBooking(null)
      setEditFormData({ vehicle_id: '', start_date: '', end_date: '', start_time: '09:00', end_time: '17:00', driver_name: '', number_of_passengers: '', trip_description: '' })
      await fetchMyBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      setMessage({ type: 'error', text: 'Failed to update booking. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Booking cancelled successfully.' })
      await fetchMyBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setMessage({ type: 'error', text: 'Failed to cancel booking. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  function handleEditBooking(booking: Booking) {
    setEditingBooking(booking)
    setEditFormData({
      vehicle_id: booking.vehicle_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      start_time: (booking as any).start_time || '09:00',
      end_time: (booking as any).end_time || '17:00',
      driver_name: (booking as any).driver_name || '',
      number_of_passengers: (booking as any).number_of_passengers ? String((booking as any).number_of_passengers) : '',
      trip_description: (booking as any).trip_description || ''
    })
  }

  function cancelEdit() {
    setEditingBooking(null)
    setEditFormData({ vehicle_id: '', start_date: '', end_date: '', start_time: '09:00', end_time: '17:00', driver_name: '', number_of_passengers: '', trip_description: '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Pending Bookings</h1>
        <p className="text-gray-600 mt-2">View and manage your pending vehicle bookings</p>
      </div>

      {/* Email Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMyBookings()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchMyBookings}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'View Bookings'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Edit Form */}
      {editingBooking && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Edit size={20} className="text-blue-500" />
            Edit Booking
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
              <select
                required
                value={editFormData.vehicle_id}
                onChange={(e) => setEditFormData({ ...editFormData, vehicle_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a vehicle...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={editFormData.start_date}
                  onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={editFormData.end_date}
                  onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                  min={editFormData.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={editFormData.start_time}
                  onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={editFormData.end_time}
                  onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designated Driver Name</label>
              <input
                type="text"
                placeholder="Full name of the driver"
                value={editFormData.driver_name}
                onChange={(e) => setEditFormData({ ...editFormData, driver_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Passengers</label>
              <input
                type="number"
                min="1"
                placeholder="How many people will be travelling"
                value={editFormData.number_of_passengers}
                onChange={(e) => setEditFormData({ ...editFormData, number_of_passengers: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Description</label>
              <textarea
                rows={3}
                placeholder="Purpose of the trip, destination, etc."
                value={editFormData.trip_description}
                onChange={(e) => setEditFormData({ ...editFormData, trip_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdateBooking}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Booking'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            Your Pending Bookings
          </h2>
          
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Car size={20} className="text-gray-500" />
                      <span className="font-semibold">
                        {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({booking.vehicles?.license_plate})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>From:</strong> {new Date(booking.start_date).toLocaleDateString()} at {(booking as any).start_time || '09:00'}
                      </p>
                      <p>
                        <strong>To:</strong> {new Date(booking.end_date).toLocaleDateString()} at {(booking as any).end_time || '17:00'}
                      </p>
                      <p>
                        <strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit booking"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel booking"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
