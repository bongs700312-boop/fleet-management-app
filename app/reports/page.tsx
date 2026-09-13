'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase/types'
import { 
  BarChart3, 
  Gauge, 
  Calendar, 
  DollarSign, 
  Droplets, 
  Download, 
  FileText, 
  Car,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type Fine = Database['public']['Tables']['fines']['Row']
type Carwash = Database['public']['Tables']['carwashes']['Row']

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [carwashes, setCarwashes] = useState<Carwash[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vehiclesResponse, bookingsResponse, finesResponse, carwashesResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('fines').select('*'),
        supabase.from('carwashes').select('*')
      ])

      if (vehiclesResponse.error) throw vehiclesResponse.error
      if (bookingsResponse.error) throw bookingsResponse.error
      if (finesResponse.error) throw finesResponse.error
      if (carwashesResponse.error) throw carwashesResponse.error

      setVehicles(vehiclesResponse.data || [])
      setBookings(bookingsResponse.data || [])
      setFines(finesResponse.data || [])
      setCarwashes(carwashesResponse.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // KPI Calculations
  const totalFleetMileage = vehicles.reduce((sum, v) => sum + v.current_mileage, 0)
  const activeBookings = bookings.filter(b => b.status === 'in_progress' || b.status === 'approved').length
  const upcomingServices = vehicles.filter(v => v.next_service_date && new Date(v.next_service_date) > new Date()).length
  const overdueServices = vehicles.filter(v => v.next_service_date && new Date(v.next_service_date) < new Date()).length
  const totalFines = fines.reduce((sum, f) => sum + f.amount, 0)
  const pendingFines = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
  const totalCarwashSpend = carwashes.reduce((sum, c) => sum + c.cost, 0)
  const monthlyCarwashSpend = carwashes
    .filter(c => {
      const washDate = new Date(c.wash_date)
      const now = new Date()
      return washDate.getMonth() === now.getMonth() && washDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, c) => sum + c.cost, 0)

  // Export Functions
  function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  function generateTripLogsPDF() {
    setGeneratingReport(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.text('Fleet Trip Logs Report', 14, 22)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

      const tableData = bookings.map(booking => {
        const vehicle = vehicles.find(v => v.id === booking.vehicle_id)
        return [
          vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
          vehicle?.license_plate || 'N/A',
          booking.user_email,
          new Date(booking.start_date).toLocaleDateString(),
          new Date(booking.end_date).toLocaleDateString(),
          booking.status
        ]
      })

      autoTable(doc, {
        head: [['Vehicle', 'License Plate', 'User', 'Start Date', 'End Date', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })

      doc.save('trip-logs-report.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  function generateVehicleHistoriesPDF() {
    setGeneratingReport(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.text('Vehicle Histories Report', 14, 22)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

      const tableData = vehicles.map(vehicle => {
        const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id).length
        const vehicleFines = fines.filter(f => f.vehicle_id === vehicle.id).reduce((sum, f) => sum + f.amount, 0)
        const vehicleCarwashes = carwashes.filter(c => c.vehicle_id === vehicle.id).reduce((sum, c) => sum + c.cost, 0)
        
        return [
          `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          vehicle.license_plate,
          vehicle.status,
          vehicle.current_mileage.toLocaleString() + ' km',
          vehicleBookings,
          '$' + vehicleFines.toLocaleString(),
          '$' + vehicleCarwashes.toFixed(2),
          vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'N/A'
        ]
      })

      autoTable(doc, {
        head: [['Vehicle', 'License Plate', 'Status', 'Mileage', 'Bookings', 'Fines', 'Carwash Cost', 'Next Service']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })

      doc.save('vehicle-histories-report.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  function generateExpenseSummaryPDF() {
    setGeneratingReport(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.text('Expense Summary Report', 14, 22)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

      // Summary section
      doc.setFontSize(12)
      doc.text('Total Expenses', 14, 45)
      
      const summaryData = [
        ['Total Fines', '$' + totalFines.toLocaleString()],
        ['Pending Fines', '$' + pendingFines.toLocaleString()],
        ['Total Carwash Spend', '$' + totalCarwashSpend.toFixed(2)],
        ['Monthly Carwash Spend', '$' + monthlyCarwashSpend.toFixed(2)]
      ]

      const summaryTable = autoTable(doc, {
        head: [['Category', 'Amount']],
        body: summaryData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] }
      })

      // Fines breakdown
      doc.setFontSize(12)
      const summaryY = (summaryTable as any).finalY ? (summaryTable as any).finalY + 15 : 70
      doc.text('Fines Breakdown', 14, summaryY)

      const finesData = fines.map(fine => {
        const vehicle = vehicles.find(v => v.id === fine.vehicle_id)
        return [
          vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
          fine.staff_email,
          new Date(fine.fine_date).toLocaleDateString(),
          '$' + fine.amount.toLocaleString(),
          fine.status,
          fine.reason
        ]
      })

      autoTable(doc, {
        head: [['Vehicle', 'Staff Email', 'Date', 'Amount', 'Status', 'Reason']],
        body: finesData,
        startY: summaryY + 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] }
      })

      // Carwash breakdown
      doc.addPage()
      doc.setFontSize(20)
      doc.text('Carwash Expenses', 14, 22)

      const carwashData = carwashes.map(carwash => {
        const vehicle = vehicles.find(v => v.id === carwash.vehicle_id)
        return [
          vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
          carwash.staff_name,
          new Date(carwash.wash_date).toLocaleDateString(),
          '$' + carwash.cost.toFixed(2),
          carwash.notes || 'N/A'
        ]
      })

      autoTable(doc, {
        head: [['Vehicle', 'Staff Name', 'Date', 'Cost', 'Notes']],
        body: carwashData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })

      doc.save('expense-summary-report.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingReport(false)
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
        <h1 className="text-3xl font-bold text-gray-900">Executive Reports</h1>
        <p className="text-gray-600 mt-2">Fleet management dashboard and analytics</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Gauge className="text-blue-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Total Fleet Mileage</p>
              <p className="text-2xl font-bold text-gray-900">{totalFleetMileage.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-green-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{activeBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Car className="text-orange-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Upcoming Services</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Overdue Services</p>
              <p className="text-2xl font-bold text-red-600">{overdueServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="text-red-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Total Fines</p>
              <p className="text-2xl font-bold text-red-600">${totalFines.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Droplets className="text-cyan-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Total Carwash Spend</p>
              <p className="text-2xl font-bold text-cyan-600">${totalCarwashSpend.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="text-blue-500" size={20} />
          Generate Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trip Logs Report */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BarChart3 size={18} />
              Trip Logs
            </h3>
            <p className="text-sm text-gray-600 mb-4">Complete booking and trip history</p>
            <div className="flex gap-2">
              <button
                onClick={generateTripLogsPDF}
                disabled={generatingReport}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                PDF
              </button>
              <button
                onClick={() => exportToCSV(bookings, 'trip-logs.csv')}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>

          {/* Vehicle Histories Report */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Car size={18} />
              Vehicle Histories
            </h3>
            <p className="text-sm text-gray-600 mb-4">Individual vehicle records and stats</p>
            <div className="flex gap-2">
              <button
                onClick={generateVehicleHistoriesPDF}
                disabled={generatingReport}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                PDF
              </button>
              <button
                onClick={() => exportToCSV(vehicles, 'vehicle-histories.csv')}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>

          {/* Expense Summary Report */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign size={18} />
              Expense Summary
            </h3>
            <p className="text-sm text-gray-600 mb-4">Fines, carwash costs, and totals</p>
            <div className="flex gap-2">
              <button
                onClick={generateExpenseSummaryPDF}
                disabled={generatingReport}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                PDF
              </button>
              <button
                onClick={() => exportToCSV([...fines, ...carwashes], 'expense-summary.csv')}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Fleet Overview
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Vehicles</span>
              <span className="font-semibold">{vehicles.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available</span>
              <span className="font-semibold text-green-600">{vehicles.filter(v => v.status === 'available').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Booked</span>
              <span className="font-semibold text-blue-600">{vehicles.filter(v => v.status === 'booked').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Maintenance</span>
              <span className="font-semibold text-orange-600">{vehicles.filter(v => v.status === 'maintenance').length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            Financial Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Fines</span>
              <span className="font-semibold text-red-600">${pendingFines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Fines</span>
              <span className="font-semibold text-green-600">${fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Carwash</span>
              <span className="font-semibold text-cyan-600">${monthlyCarwashSpend.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Cost per Wash</span>
              <span className="font-semibold">
                ${carwashes.length > 0 ? (totalCarwashSpend / carwashes.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}