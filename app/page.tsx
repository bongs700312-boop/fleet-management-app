'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { LayoutDashboard, Car, ClipboardCheck, DollarSign, Droplets, FileText, Calendar, AlertTriangle } from 'lucide-react'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type Fine = Database['public']['Tables']['fines']['Row']
type Carwash = Database['public']['Tables']['carwashes']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [carwashes, setCarwashes] = useState<Carwash[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesResponse, bookingsResponse, finesResponse, carwashesResponse, inspectionsResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('fines').select('*'),
        supabase.from('carwashes').select('*'),
        supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (bookingsResponse.error) throw bookingsResponse.error
      if (finesResponse.error) throw finesResponse.error
      if (carwashesResponse.error) throw carwashesResponse.error
      if (inspectionsResponse.error) throw inspectionsResponse.error

      setVehicles(vehiclesResponse.data || [])
      setBookings(bookingsResponse.data || [])
      setFines(finesResponse.data || [])
      setCarwashes(carwashesResponse.data || [])
      setInspections(inspectionsResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalVehicles = vehicles.length
  const activeBookings = bookings.filter(b => b.status === 'in_progress' || b.status === 'approved').length
  const pendingFines = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
  const totalCarwashes = carwashes.length
  const recentInspections = inspections.length
  const overdueServices = vehicles.filter(v => v.next_service_date && new Date(v.next_service_date) < new Date()).length

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Fleet Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Vehicles"
          value={totalVehicles.toString()}
          icon={Car}
          change={`${vehicles.filter(v => v.status === 'available').length} available`}
          positive
        />
        <StatCard
          title="Active Bookings"
          value={activeBookings.toString()}
          icon={Calendar}
          change={`${bookings.filter(b => b.status === 'pending').length} pending approval`}
          neutral
        />
        <StatCard
          title="Outstanding Fines"
          value={`R${pendingFines.toLocaleString()}`}
          icon={DollarSign}
          change={`${fines.filter(f => f.status === 'pending').length} pending fines`}
          negative={pendingFines > 0}
          positive={pendingFines === 0}
        />
        <StatCard
          title="Total Carwashes"
          value={totalCarwashes.toString()}
          icon={Droplets}
          change={`${carwashes.filter(c => {
            const washDate = new Date(c.wash_date)
            const now = new Date()
            return washDate.getMonth() === now.getMonth() && washDate.getFullYear() === now.getFullYear()
          }).length} this month`}
          positive
        />
        <StatCard
          title="Recent Inspections"
          value={recentInspections.toString()}
          icon={ClipboardCheck}
          change="Last 5 activities"
          neutral
        />
        <StatCard
          title="Service Alerts"
          value={overdueServices.toString()}
          icon={AlertTriangle}
          change={overdueServices > 0 ? 'Vehicles overdue for service' : 'All services up to date'}
          negative={overdueServices > 0}
          positive={overdueServices === 0}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {inspections.length === 0 ? (
          <p className="text-gray-600">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <ActivityItem
                key={inspection.id}
                title={`${inspection.inspection_type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'} Inspection`}
                description={`${inspection.inspector_name} - Vehicle: ${inspection.vehicle_id}`}
                time={new Date(inspection.created_at).toLocaleString()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, change, positive, negative, neutral }: any) {
  const changeColor = positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-gray-600'
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={24} />
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ title, description, time }: any) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  )
}
