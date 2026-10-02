'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Car, Calendar, Mail, CheckCircle, AlertCircle } from 'lucide-react'

type CompanyRule = Database['public']['Tables']['company_rules']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function BookingPage() {
  const [rules, setRules] = useState<CompanyRule[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    user_email: '',
    start_date: '',
    end_date: ''
  })

  const supabase = createClient()

  const checkBookingConflict = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    // Check for existing bookings that overlap with the requested date range
    // Only consider bookings that are not rejected or completed
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'approved', 'in_progress'])

    if (error) throw error

    if (!existingBookings || existingBookings.length === 0) {
      return null // No conflict
    }

    // Check for date overlap
    // Two date ranges overlap if: (start1 <= end2) AND (end1 >= start2)
    const requestedStart = new Date(startDate)
    const requestedEnd = new Date(endDate)

    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.start_date)
      const bookingEnd = new Date(booking.end_date)

      if (requestedStart <= bookingEnd && requestedEnd >= bookingStart) {
        // Found a conflict
        return {
          conflict: true,
          availableAfter: bookingEnd
        }
      }
    }

    return null // No conflict
  }, [supabase])

  useEffect(() => {
    fetchRulesAndVehicles()
  }, [])

  // Check availability when vehicle or dates change
  useEffect(() => {
    async function checkAvailability() {
      if (formData.vehicle_id && formData.start_date && formData.end_date) {
        const conflict = await checkBookingConflict(
          formData.vehicle_id,
          formData.start_date,
          formData.end_date
        )

        if (conflict) {
          const availableDate = new Date(conflict.availableAfter)
          availableDate.setDate(availableDate.getDate() + 1)
          const formattedDate = availableDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          setAvailabilityMessage(
            `Vehicle not available for these dates. Available from ${formattedDate}`
          )
        } else {
          setAvailabilityMessage('Vehicle is available for these dates')
        }
      } else {
        setAvailabilityMessage(null)
      }
    }

    checkAvailability()
  }, [formData.vehicle_id, formData.start_date, formData.end_date, checkBookingConflict])

  async function fetchRulesAndVehicles() {
    try {
      const [rulesResponse, vehiclesResponse] = await Promise.all([
        supabase.from('company_rules').select('*'),
        supabase.from('vehicles').select('*').eq('status', 'available')
      ])

      if (rulesResponse.error) throw rulesResponse.error
      if (vehiclesResponse.error) throw vehiclesResponse.error

      setRules(rulesResponse.data || [])
      setVehicles(vehiclesResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load data. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      // Create booking via API (server-side validation)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          user_email: formData.user_email,
          start_date: formData.start_date,
          end_date: formData.end_date
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict - vehicle not available
          setMessage({
            type: 'error',
            text: data.error || 'This vehicle is not available for the selected dates.'
          })
        } else {
          setMessage({
            type: 'error',
            text: data.error || 'Failed to submit booking. Please try again.'
          })
        }
        setSubmitting(false)
        return
      }

      const booking = data.booking

      // Send email notification
      const emailResponse = await fetch('/api/email/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: booking,
          vehicle: vehicles.find(v => v.id === formData.vehicle_id)
        })
      })

      if (!emailResponse.ok) {
        console.error('Email notification failed')
      }

      setMessage({ type: 'success', text: 'Booking submitted successfully! Confirmation email sent.' })
      setFormData({ vehicle_id: '', user_email: '', start_date: '', end_date: '' })
      
      // Keep acknowledged true so the user can see the success message
      // Reset after 3 seconds
      setTimeout(() => {
        setAcknowledged(false)
        setMessage(null)
      }, 3000)
      
      // Refresh vehicles
      await fetchRulesAndVehicles()
    } catch (error) {
      console.error('Error submitting booking:', error)
      setMessage({ type: 'error', text: 'Failed to submit booking. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Book a Vehicle</h1>
        <p className="text-gray-600 mt-2">Review company rules and book a vehicle</p>
      </div>

      {/* Company Rules Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="text-orange-500" size={20} />
          Company Rules
        </h2>
        
        {rules.length === 0 ? (
          <p className="text-gray-600">No company rules configured yet.</p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border-l-4 border-orange-400 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">{rule.title}</h3>
                <p className="text-gray-600 mt-1">{rule.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I have read and acknowledge the company rules above. I understand that violation of these rules may result in disciplinary action.
            </span>
          </label>
        </div>
      </div>

      {/* Booking Form */}
      {acknowledged && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            Book a Vehicle
          </h2>

          {message && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle
              </label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="your.email@company.com"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {availabilityMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                availabilityMessage.includes('not available')
                  ? 'bg-orange-50 text-orange-800 border border-orange-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {availabilityMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || availabilityMessage?.includes('not available')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Car size={20} />
                  Submit Booking Request
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {!acknowledged && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Car className="mx-auto text-blue-400 mb-2" size={32} />
          <p className="text-blue-800">Please acknowledge the company rules above to proceed with booking.</p>
        </div>
      )}
    </div>
  )
}