import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { booking, vehicle, status } = await request.json()

    if (!booking || !vehicle) {
      return NextResponse.json(
        { error: 'Missing booking or vehicle data' },
        { status: 400 }
      )
    }

    let subject, emailContent

    if (status === 'approved') {
      subject = `Booking Approved - ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      emailContent = `
        <h1>Booking Approved</h1>
        
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</li>
          <li><strong>Status:</strong> Approved</li>
        </ul>
        
        <h2>Vehicle Details:</h2>
        <ul>
          <li><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model}</li>
          <li><strong>License Plate:</strong> ${vehicle.license_plate}</li>
        </ul>
        
        <p>Your vehicle booking has been approved. Please proceed with the check-out inspection before your trip.</p>
        
        <p><em>This is an automated notification from the Fleet Management System.</em></p>
      `
    } else if (status === 'rejected') {
      subject = `Booking Rejected - ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      emailContent = `
        <h1>Booking Rejected</h1>
        
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</li>
          <li><strong>Status:</strong> Rejected</li>
        </ul>
        
        <h2>Vehicle Details:</h2>
        <ul>
          <li><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model}</li>
          <li><strong>License Plate:</strong> ${vehicle.license_plate}</li>
        </ul>
        
        <p>Your vehicle booking has been rejected. Please contact the fleet management team for more information or submit a new booking request.</p>
        
        <p><em>This is an automated notification from the Fleet Management System.</em></p>
      `
    } else {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'Fleet Management System <fleet-management@yourdomain.com>',
      to: booking.user_email,
      subject,
      html: emailContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}