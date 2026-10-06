'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Car, Mail, Calendar, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react'
import { useRequireAdmin } from '@/lib/auth'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Fine = Database['public']['Tables']['fines']['Row']

export default function FinesPage() {
  const { user, loading: authLoading } = useRequireAdmin()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    staff_email: '',
    fine_date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesResponse, finesResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('fines').select('*').order('fine_date', { ascending: false })
      ])

      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (finesResponse.error) throw finesResponse.error

      setVehicles(vehiclesResponse.data || [])
      setFines(finesResponse.data || [])
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
      // Create fine record
      const { data: fineData, error: fineError } = await supabase.from('fines').insert({
        vehicle_id: formData.vehicle_id,
        staff_email: formData.staff_email,
        fine_date: formData.fine_date,
        amount: Number(formData.amount),
        reason: formData.reason,
        status: 'pending'
      }).select()

      if (fineError) throw fineError

      // Get vehicle details for email
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
      const fine = fineData?.[0]

      // Send email notification
      const emailResponse = await fetch('/api/email/fine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fine: fine,
          vehicle: vehicle
        })
      })

      if (!emailResponse.ok) {
        console.error('Email notification failed')
      }

      setMessage({ type: 'success', text: 'Fine logged successfully and notification sent to staff member.' })
      setFormData({
        vehicle_id: '',
        staff_email: '',
        fine_date: new Date().toISOString().split('T')[0],
        amount: '',
        reason: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error submitting fine:', error)
      setMessage({ type: 'error', text: 'Failed to log fine. Please try again.' })
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
        <h1 className="text-3xl font-bold text-gray-900">Fines</h1>
        <p className="text-gray-600 mt-2">Log and manage traffic violations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Fines</p>
              <p className="text-2xl font-bold text-gray-900">{fines.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-600">
                R${fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Pending Fines</p>
              <p className="text-2xl font-bold text-red-600">{fines.filter(f => f.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fine Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-blue-500" size={20} />
            Log New Fine
          </h2>

          {message && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Member Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="staff@company.com"
                  value={formData.staff_email}
                  onChange={(e) => setFormData({ ...formData, staff_email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fine Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    required
                    value={formData.fine_date}
                    onChange={(e) => setFormData({ ...formData, fine_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (R)
                </label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Fine
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the traffic violation..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <AlertTriangle size={20} />
                  Log Fine & Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Fines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            Recent Fines
          </h2>
          
          {fines.length === 0 ? (
            <p className="text-gray-600">No fines recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {fines.map((fine) => {
                const vehicle = vehicles.find(v => v.id === fine.vehicle_id)
                return (
                  <div key={fine.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            fine.status === 'pending' ? 'bg-red-100 text-red-800' :
                            fine.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fine.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(fine.fine_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-lg text-red-600">R${fine.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}` : 'Unknown vehicle'}
                        </p>
                        <p className="text-sm text-gray-600">Staff: {fine.staff_email}</p>
                        <p className="text-sm text-gray-500 mt-1">{fine.reason}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}