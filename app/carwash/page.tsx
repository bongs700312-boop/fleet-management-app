'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Droplets, Car, User, DollarSign, Calendar, CheckCircle, XCircle, FileText, TrendingUp } from 'lucide-react'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Carwash = Database['public']['Tables']['carwashes']['Row']

export default function CarwashPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [carwashes, setCarwashes] = useState<Carwash[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    staff_name: '',
    wash_date: new Date().toISOString().split('T')[0],
    cost: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesResponse, carwashesResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('carwashes').select('*').order('wash_date', { ascending: false })
      ])

      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (carwashesResponse.error) throw carwashesResponse.error

      setVehicles(vehiclesResponse.data || [])
      setCarwashes(carwashesResponse.data || [])
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
      const { error } = await supabase.from('carwashes').insert({
        vehicle_id: formData.vehicle_id,
        staff_name: formData.staff_name,
        wash_date: formData.wash_date,
        cost: Number(formData.cost),
        notes: formData.notes
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Carwash logged successfully.' })
      setFormData({
        vehicle_id: '',
        staff_name: '',
        wash_date: new Date().toISOString().split('T')[0],
        cost: '',
        notes: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error submitting carwash:', error)
      setMessage({ type: 'error', text: 'Failed to log carwash. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function getMonthlyTotal() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return carwashes
      .filter(carwash => {
        const washDate = new Date(carwash.wash_date)
        return washDate.getMonth() === currentMonth && washDate.getFullYear() === currentYear
      })
      .reduce((total, carwash) => total + carwash.cost, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const monthlyTotal = getMonthlyTotal()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Carwash</h1>
        <p className="text-gray-600 mt-2">Log and manage vehicle carwash records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Carwashes</p>
              <p className="text-2xl font-bold text-gray-900">{carwashes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Monthly Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${monthlyTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Average Cost</p>
              <p className="text-2xl font-bold text-purple-600">
                ${carwashes.length > 0 ? (carwashes.reduce((sum, c) => sum + c.cost, 0) / carwashes.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carwash Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Droplets className="text-blue-500" size={20} />
            Log New Carwash
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
                Staff Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.staff_name}
                  onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wash Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    required
                    value={formData.wash_date}
                    onChange={(e) => setFormData({ ...formData, wash_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Additional details about the carwash..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Droplets size={20} />
                  Log Carwash
                </>
              )}
            </button>
          </form>
        </div>

        {/* Carwash History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            Carwash History
          </h2>
          
          {carwashes.length === 0 ? (
            <p className="text-gray-600">No carwash records yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {carwashes.map((carwash) => {
                const vehicle = vehicles.find(v => v.id === carwash.vehicle_id)
                return (
                  <div key={carwash.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">
                            {new Date(carwash.wash_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-lg text-green-600">${carwash.cost.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}` : 'Unknown vehicle'}
                        </p>
                        <p className="text-sm text-gray-600">Staff: {carwash.staff_name}</p>
                        {carwash.notes && (
                          <p className="text-sm text-gray-500 mt-1">{carwash.notes}</p>
                        )}
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