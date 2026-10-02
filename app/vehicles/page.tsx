'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { Car, Plus, Wrench, AlertTriangle, CheckCircle, Edit, Calendar, Gauge } from 'lucide-react'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

type ViewMode = 'list' | 'add' | 'edit'

export default function VehiclesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setMessage({ type: 'error', text: 'Failed to load vehicles. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  function needsService(vehicle: Vehicle): boolean {
    const kmUntilService = vehicle.next_service_mileage - vehicle.current_mileage
    const mileageNeeded = kmUntilService <= 500 && kmUntilService > 0
    
    // Check if service date is within 7 days
    let dateNeeded = false
    if (vehicle.next_service_date) {
      const daysUntilService = Math.ceil((new Date(vehicle.next_service_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      dateNeeded = daysUntilService <= 7 && daysUntilService > 0
    }
    
    return mileageNeeded || dateNeeded
  }

  function isOverdueService(vehicle: Vehicle): boolean {
    const mileageOverdue = vehicle.current_mileage >= vehicle.next_service_mileage
    let dateOverdue = false
    if (vehicle.next_service_date) {
      dateOverdue = new Date(vehicle.next_service_date) < new Date()
    }
    return mileageOverdue || dateOverdue
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading vehicles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles & Services</h1>
          <p className="text-gray-600 mt-2">Manage fleet vehicles and service schedules</p>
        </div>
        <button
          onClick={() => setViewMode('add')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {viewMode === 'list' && (
        <VehicleList
          vehicles={vehicles}
          needsService={needsService}
          isOverdueService={isOverdueService}
          onEdit={(vehicle) => {
            setSelectedVehicle(vehicle)
            setViewMode('edit')
          }}
        />
      )}

      {viewMode === 'add' && (
        <VehicleForm
          mode="add"
          onSuccess={() => {
            setViewMode('list')
            fetchVehicles()
            setMessage({ type: 'success', text: 'Vehicle added successfully!' })
          }}
          onCancel={() => setViewMode('list')}
          setMessage={setMessage}
        />
      )}

      {viewMode === 'edit' && selectedVehicle && (
        <VehicleForm
          mode="edit"
          vehicle={selectedVehicle}
          onSuccess={() => {
            setViewMode('list')
            setSelectedVehicle(null)
            fetchVehicles()
            setMessage({ type: 'success', text: 'Vehicle updated successfully!' })
          }}
          onCancel={() => {
            setViewMode('list')
            setSelectedVehicle(null)
          }}
          setMessage={setMessage}
        />
      )}
    </div>
  )
}

function VehicleList({
  vehicles,
  needsService,
  isOverdueService,
  onEdit
}: {
  vehicles: Vehicle[]
  needsService: (vehicle: Vehicle) => boolean
  isOverdueService: (vehicle: Vehicle) => boolean
  onEdit: (vehicle: Vehicle) => void
}) {
  const serviceNeededCount = vehicles.filter(v => needsService(v)).length
  const overdueCount = vehicles.filter(v => isOverdueService(v)).length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Car className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Wrench className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Service Needed</p>
              <p className="text-2xl font-bold text-orange-600">{serviceNeededCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Overdue Service</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Fleet Vehicles</h2>
        </div>
        {vehicles.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No vehicles in the fleet. Add your first vehicle to get started.
          </div>
        ) : (
          <div className="divide-y">
            {vehicles.map((vehicle) => {
              const needsServiceFlag = needsService(vehicle)
              const isOverdue = isOverdueService(vehicle)
              const kmUntilService = vehicle.next_service_mileage - vehicle.current_mileage

              return (
                <div
                  key={vehicle.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    isOverdue ? 'bg-red-50 border-l-4 border-red-500' :
                    needsServiceFlag ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                          vehicle.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vehicle.status}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Overdue
                          </span>
                        )}
                        {needsServiceFlag && !isOverdue && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                            <Wrench size={12} />
                            Service Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">License Plate: {vehicle.license_plate}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Current Mileage</p>
                          <p className="font-medium flex items-center gap-1">
                            <Gauge size={16} />
                            {vehicle.current_mileage.toLocaleString()} km
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Next Service At</p>
                          <p className={`font-medium ${isOverdue ? 'text-red-600' : needsServiceFlag ? 'text-orange-600' : 'text-gray-900'}`}>
                            {vehicle.next_service_mileage.toLocaleString()} km
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Service</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar size={16} />
                            {vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Next Service Date</p>
                          <p className={`font-medium flex items-center gap-1 ${
                            vehicle.next_service_date && new Date(vehicle.next_service_date) < new Date() ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            <Calendar size={16} />
                            {vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">License Disk Expiry</p>
                          <p className={`font-medium flex items-center gap-1 ${
                            vehicle.license_disk_expiry_date && new Date(vehicle.license_disk_expiry_date) < new Date() ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            <Calendar size={16} />
                            {vehicle.license_disk_expiry_date ? new Date(vehicle.license_disk_expiry_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {needsServiceFlag && (
                        <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Service Alert:</strong> Vehicle needs service within {kmUntilService > 0 ? kmUntilService.toLocaleString() : '0'} km
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="ml-4 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={20} />
                    </button>
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

function VehicleForm({
  mode,
  vehicle,
  onSuccess,
  onCancel,
  setMessage
}: {
  mode: 'add' | 'edit'
  vehicle?: Vehicle | null
  onSuccess: () => void
  onCancel: () => void
  setMessage: (value: { type: 'success' | 'error', text: string } | null) => void
}) {
  const [formData, setFormData] = useState({
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    license_plate: vehicle?.license_plate || '',
    status: vehicle?.status || 'available',
    current_mileage: vehicle?.current_mileage || 0,
    last_service_mileage: vehicle?.last_service_mileage || 0,
    next_service_mileage: vehicle?.next_service_mileage || 10000,
    last_service_date: vehicle?.last_service_date || '',
    next_service_date: vehicle?.next_service_date || '',
    license_disk_expiry_date: vehicle?.license_disk_expiry_date || ''
  })

  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        license_plate: formData.license_plate,
        status: formData.status,
        current_mileage: Number(formData.current_mileage),
        last_service_mileage: Number(formData.last_service_mileage),
        next_service_mileage: Number(formData.next_service_mileage),
        last_service_date: formData.last_service_date || null,
        next_service_date: formData.next_service_date || null,
        license_disk_expiry_date: formData.license_disk_expiry_date || null
      }

      let error
      if (mode === 'add') {
        const id = `${formData.make}-${formData.model}-${formData.license_plate}`.toLowerCase().replace(/\s+/g, '-')
        const { error: insertError } = await supabase.from('vehicles').insert({
          ...vehicleData,
          id
        })
        error = insertError
      } else {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle!.id)
        error = updateError
      }

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      setMessage({ type: 'error', text: 'Failed to save vehicle. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">
        {mode === 'add' ? 'Add New Vehicle' : 'Edit Vehicle'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input
              type="text"
              required
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              required
              min="1990"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
            <input
              type="text"
              required
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Wrench size={20} />
            Service Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage (km)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.current_mileage}
                onChange={(e) => setFormData({ ...formData, current_mileage: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Mileage (km)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.last_service_mileage}
                onChange={(e) => setFormData({ ...formData, last_service_mileage: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Mileage (km)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.next_service_mileage}
                onChange={(e) => setFormData({ ...formData, next_service_mileage: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
              <input
                type="date"
                value={formData.last_service_date}
                onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Date</label>
              <input
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calendar size={20} />
            License Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Disk Expiry Date</label>
              <input
                type="date"
                value={formData.license_disk_expiry_date}
                onChange={(e) => setFormData({ ...formData, license_disk_expiry_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : mode === 'add' ? 'Add Vehicle' : 'Update Vehicle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}