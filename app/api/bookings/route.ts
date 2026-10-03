import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { vehicle_id, user_email, start_date, end_date, start_time, end_time } = body

    // Validate required fields
    if (!vehicle_id || !user_email || !start_date || !end_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for booking conflicts (server-side validation)
    const { data: existingBookings, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['pending', 'approved', 'in_progress'])

    if (queryError) {
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }

    // Check for date and time overlap
    const requestedStart = new Date(`${start_date}T${start_time}`)
    const requestedEnd = new Date(`${end_date}T${end_time}`)

    if (existingBookings && existingBookings.length > 0) {
      for (const booking of existingBookings) {
        const bookingStart = new Date(`${booking.start_date}T${booking.start_time}`)
        const bookingEnd = new Date(`${booking.end_date}T${booking.end_time}`)

        if (requestedStart <= bookingEnd && requestedEnd >= bookingStart) {
          // Found a conflict
          const formattedTime = bookingEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const formattedDate = bookingEnd.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          return NextResponse.json(
            { 
              error: 'Vehicle not available for these times',
              availableAfter: `${formattedDate} at ${formattedTime}`
            },
            { status: 409 }
          )
        }
      }
    }

    // Create booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        vehicle_id,
        user_email,
        start_date,
        end_date,
        start_time,
        end_time,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking: bookingData }, { status: 201 })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
