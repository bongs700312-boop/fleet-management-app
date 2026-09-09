'use client'

import { useState, useEffect } from 'react'
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
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    user_email: '',
    start_date: '',
    end_date: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchRulesAndVehicles()
  }, [])

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
      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          vehicle_id: formData.vehicle_id,
          user_email: formData.user_email,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: 'pending'
        })
        .select()

      if (bookingError) throw bookingError

      const booking = bookingData?.[0]

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
        <h1 className="text-3xl font-bold text-gray-900">Rules & Booking</h1>
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

            <button
              type="submit"
              disabled={submitting}
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