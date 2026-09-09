'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { ClipboardCheck, Car, User, Gauge, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

type Booking = Database['public']['Tables']['bookings']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']

type TabType = 'checkout' | 'checkin'

export default function InspectionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('checkout')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [bookingsResponse, vehiclesResponse, inspectionsResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .in('status', ['approved', 'in_progress']),
        supabase.from('vehicles').select('*'),
        supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      if (bookingsResponse.error) throw bookingsResponse.error
      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (inspectionsResponse.error) throw inspectionsResponse.error

      setBookings(bookingsResponse.data || [])
      setVehicles(vehiclesResponse.data || [])
      setInspections(inspectionsResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load data. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-In/out Inspections</h1>
        <p className="text-gray-600 mt-2">Manage vehicle inspections before and after trips</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'checkout'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ClipboardCheck size={20} />
                Pre-Trip Check-Out
              </div>
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'checkin'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={20} />
                Post-Trip Check-In
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'checkout' ? (
                <CheckOutForm
                  bookings={bookings}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  message={message}
                  setMessage={setMessage}
                  onSuccess={fetchData}
                />
              ) : (
                <CheckInForm
                  vehicles={vehicles}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  message={message}
                  setMessage={setMessage}
                  onSuccess={fetchData}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Inspections</h2>
        {inspections.length === 0 ? (
          <p className="text-gray-600">No inspections recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {inspections.map((inspection) => {
              const vehicle = vehicles.find(v => v.id === inspection.vehicle_id)
              return (
                <div key={inspection.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          inspection.inspection_type === 'pre_trip'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {inspection.inspection_type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(inspection.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium mt-1">Inspector: {inspection.inspector_name}</p>
                      <p className="text-sm text-gray-600">
                        Vehicle: {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}` : 'Unknown vehicle'}
                      </p>
                      {inspection.start_km && (
                        <p className="text-sm text-gray-600">Start KM: {inspection.start_km}</p>
                      )}
                      {inspection.end_km && (
                        <p className="text-sm text-gray-600">End KM: {inspection.end_km}</p>
                      )}
                      {inspection.condition_notes && (
                        <p className="text-sm text-gray-600 mt-1">Notes: {inspection.condition_notes}</p>
                      )}
                      {inspection.issues_found && (
                        <p className="text-sm text-orange-600 mt-1">Issues: {inspection.issues_found}</p>
                      )}
                    </div>
                    {inspection.issues_found ? (
                      <AlertTriangle className="text-orange-500" size={20} />
                    ) : (
                      <CheckCircle className="text-green-500" size={20} />
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

function CheckOutForm({
  bookings,
  submitting,
  setSubmitting,
  message,
  setMessage,
  onSuccess
}: {
  bookings: Booking[]
  submitting: boolean
  setSubmitting: (value: boolean) => void
  message: { type: 'success' | 'error', text: string } | null
  setMessage: (value: { type: 'success' | 'error', text: string } | null) => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    booking_id: '' as string,
    inspector_name: '',
    start_km: '',
    condition_notes: ''
  })

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const booking = bookings.find(b => b.id === formData.booking_id)
      if (!booking) throw new Error('Booking not found')

      // Create inspection record
      const { error: inspectionError } = await supabase.from('inspections').insert({
        booking_id: formData.booking_id,
        vehicle_id: booking.vehicle_id,
        inspection_type: 'pre_trip',
        inspector_name: formData.inspector_name,
        start_km: Number(formData.start_km),
        condition_notes: formData.condition_notes,
        issues_found: ''
      })

      if (inspectionError) throw inspectionError

      // Update booking status to in_progress
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', formData.booking_id)

      if (bookingError) throw bookingError

      setMessage({ type: 'success', text: 'Check-out inspection completed successfully!' })
      setFormData({ booking_id: '', inspector_name: '', start_km: '', condition_notes: '' })
      onSuccess()
    } catch (error) {
      console.error('Error submitting check-out:', error)
      setMessage({ type: 'error', text: 'Failed to complete check-out. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const activeBookings = bookings.filter(b => b.status === 'approved')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Active Booking
        </label>
        <select
          required
          value={formData.booking_id}
          onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a booking...</option>
          {activeBookings.map((booking) => {
            const vehicle = vehicles.find(v => v.id === booking.vehicle_id)
            return (
              <option key={booking.id} value={booking.id}>
                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}` : 'Unknown vehicle'} ({booking.user_email})
              </option>
            )
          })}
        </select>
        {activeBookings.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No approved bookings available for check-out.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Inspector Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            required
            placeholder="Enter inspector name"
            value={formData.inspector_name}
            onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Starting Kilometers
        </label>
        <div className="relative">
          <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="number"
            required
            min="0"
            placeholder="Enter starting kilometers"
            value={formData.start_km}
            onChange={(e) => setFormData({ ...formData, start_km: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Vehicle Condition Notes
        </label>
        <textarea
          required
          rows={3}
          placeholder="Describe the vehicle's condition before release..."
          value={formData.condition_notes}
          onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || activeBookings.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ClipboardCheck size={20} />
            Complete Check-Out Inspection
          </>
        )}
      </button>
    </form>
  )
}

function CheckInForm({
  vehicles,
  submitting,
  setSubmitting,
  message,
  setMessage,
  onSuccess
}: {
  vehicles: Vehicle[]
  submitting: boolean
  setSubmitting: (value: boolean) => void
  message: { type: 'success' | 'error', text: string } | null
  setMessage: (value: { type: 'success' | 'error', text: string } | null) => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    inspector_name: '',
    end_km: '',
    issues_found: '',
    post_trip_notes: ''
  })

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
      if (!vehicle) throw new Error('Vehicle not found')

      // Create inspection record
      const { error: inspectionError } = await supabase.from('inspections').insert({
        booking_id: null,
        vehicle_id: formData.vehicle_id,
        inspection_type: 'post_trip',
        inspector_name: formData.inspector_name,
        end_km: Number(formData.end_km),
        condition_notes: formData.post_trip_notes,
        issues_found: formData.issues_found
      })

      if (inspectionError) throw inspectionError

      // Update vehicle mileage
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          current_mileage: Number(formData.end_km),
          status: 'available'
        })
        .eq('id', formData.vehicle_id)

      if (vehicleError) throw vehicleError

      // Find and update associated booking
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', formData.vehicle_id)
        .eq('status', 'in_progress')

      if (bookingData && bookingData.length > 0) {
        await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingData[0].id)
      }

      setMessage({ type: 'success', text: 'Check-in inspection completed successfully! Vehicle mileage updated.' })
      setFormData({ vehicle_id: '', inspector_name: '', end_km: '', issues_found: '', post_trip_notes: '' })
      onSuccess()
    } catch (error) {
      console.error('Error submitting check-in:', error)
      setMessage({ type: 'error', text: 'Failed to complete check-in. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const inProgressVehicles = vehicles.filter(v => v.status === 'in_progress' || v.status === 'booked')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Returning Vehicle
        </label>
        <select
          required
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a vehicle...</option>
          {inProgressVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate} (Current: {vehicle.current_mileage} km)
            </option>
          ))}
        </select>
        {inProgressVehicles.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No vehicles currently on trips.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Inspector Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            required
            placeholder="Enter inspector name"
            value={formData.inspector_name}
            onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ending Kilometers
        </label>
        <div className="relative">
          <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="number"
            required
            min="0"
            placeholder="Enter ending kilometers"
            value={formData.end_km}
            onChange={(e) => setFormData({ ...formData, end_km: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issues Found (if any)
        </label>
        <div className="relative">
          <AlertTriangle className="absolute left-3 top-3 text-gray-400" size={20} />
          <textarea
            rows={2}
            placeholder="Describe any issues found during inspection..."
            value={formData.issues_found}
            onChange={(e) => setFormData({ ...formData, issues_found: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Post-Trip Inspection Notes
        </label>
        <textarea
          required
          rows={3}
          placeholder="Describe the vehicle's condition after the trip..."
          value={formData.post_trip_notes}
          onChange={(e) => setFormData({ ...formData, post_trip_notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || inProgressVehicles.length === 0}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            Complete Check-In Inspection
          </>
        )}
      </button>
    </form>
  )
}