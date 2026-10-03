'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Fuel, Car, User, Calendar, DollarSign, Gauge, MapPin, CheckCircle, AlertTriangle, Plus, X } from 'lucide-react'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type PetrolFillup = Database['public']['Tables']['petrol_fillups']['Row'] & {
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

export default function PetrolPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fillups, setFillups] = useState<PetrolFillup[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    staff_name: '',
    fillup_date: new Date().toISOString().split('T')[0],
    amount: '',
    liters: '',
    price_per_liter: '',
    odometer_reading: '',
    fuel_station: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesResponse, fillupsResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase
          .from('petrol_fillups')
          .select('*, vehicles(*)')
          .order('fillup_date', { ascending: false })
      ])

      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (fillupsResponse.error) throw fillupsResponse.error

      setVehicles(vehiclesResponse.data || [])
      setFillups(fillupsResponse.data || [])
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
      const { error } = await supabase
        .from('petrol_fillups')
        .insert({
          vehicle_id: formData.vehicle_id,
          staff_name: formData.staff_name,
          fillup_date: formData.fillup_date,
          amount: Number(formData.amount),
          liters: Number(formData.liters),
          price_per_liter: Number(formData.price_per_liter),
          odometer_reading: Number(formData.odometer_reading),
          fuel_station: formData.fuel_station || null,
          notes: formData.notes || null
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Petrol fillup recorded successfully!' })
      setFormData({
        vehicle_id: '',
        staff_name: '',
        fillup_date: new Date().toISOString().split('T')[0],
        amount: '',
        liters: '',
        price_per_liter: '',
        odometer_reading: '',
        fuel_station: '',
        notes: ''
      })
      setShowForm(false)
      await fetchData()
    } catch (error) {
      console.error('Error saving fillup:', error)
      setMessage({ type: 'error', text: 'Failed to record fillup. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate price per liter automatically when amount and liters change
  useEffect(() => {
    if (formData.amount && formData.liters) {
      const price = Number(formData.amount) / Number(formData.liters)
      setFormData(prev => ({ ...prev, price_per_liter: price.toFixed(2) }))
    }
  }, [formData.amount, formData.liters])

  // Calculate total monthly spend
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyTotal = fillups
    .filter(f => {
      const date = new Date(f.fillup_date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, f) => sum + f.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Petrol Fillups</h1>
          <p className="text-gray-600 mt-2">Track vehicle fuel expenses and consumption</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Record Fillup'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Fuel className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">This Month's Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R{monthlyTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Car className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Fillups</p>
              <p className="text-2xl font-bold text-gray-900">{fillups.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Average per Fillup</p>
              <p className="text-2xl font-bold text-gray-900">
                {fillups.length > 0 ? `R${(fillups.reduce((sum, f) => sum + f.amount, 0) / fillups.length).toFixed(2)}` : 'R0.00'}
              </p>
            </div>
          </div>
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

      {/* Fillup Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Fuel size={20} className="text-blue-500" />
            Record Petrol Fillup
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.staff_name}
                    onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fillup Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  required
                  value={formData.fillup_date}
                  onChange={(e) => setFormData({ ...formData, fillup_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Liter (R)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  placeholder="Auto-calculated"
                  value={formData.price_per_liter}
                  onChange={(e) => setFormData({ ...formData, price_per_liter: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (km)</label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Current mileage"
                    value={formData.odometer_reading}
                    onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Station</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g., Shell, BP, Engen"
                    value={formData.fuel_station}
                    onChange={(e) => setFormData({ ...formData, fuel_station: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Any additional information..."
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
                  Saving...
                </>
              ) : (
                <>
                  <Fuel size={20} />
                  Record Fillup
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Fillups List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Fillups</h2>
        </div>
        {fillups.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No petrol fillups recorded yet. Click "Record Fillup" to add your first entry.
          </div>
        ) : (
          <div className="divide-y">
            {fillups.map((fillup) => (
              <div key={fillup.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Car size={20} className="text-gray-500" />
                      <span className="font-semibold">
                        {fillup.vehicles?.year} {fillup.vehicles?.make} {fillup.vehicles?.model}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({fillup.vehicles?.license_plate})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{new Date(fillup.fillup_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium text-green-600">R{fillup.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Liters</p>
                        <p className="font-medium">{fillup.liters.toFixed(2)} L</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price/L</p>
                        <p className="font-medium">R{fillup.price_per_liter.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Odometer</p>
                        <p className="font-medium">{fillup.odometer_reading.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Staff</p>
                        <p className="font-medium">{fillup.staff_name}</p>
                      </div>
                      {fillup.fuel_station && (
                        <div>
                          <p className="text-gray-500">Station</p>
                          <p className="font-medium">{fillup.fuel_station}</p>
                        </div>
                      )}
                    </div>
                    {fillup.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong> {fillup.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
