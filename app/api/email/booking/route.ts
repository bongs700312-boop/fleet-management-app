import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { booking, vehicle } = await request.json()

    if (!booking || !vehicle) {
      return NextResponse.json(
        { error: 'Missing booking or vehicle data' },
        { status: 400 }
      )
    }

    const fleetManagerEmail = process.env.FLEET_MANAGER_EMAIL || 'fleet-manager@company.com'

    const emailContent = `
      <h1>New Vehicle Booking Request</h1>
      
      <h2>Booking Details:</h2>
      <ul>
        <li><strong>User Email:</strong> ${booking.user_email}</li>
        <li><strong>Start Date:</strong> ${new Date(booking.start_date).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(booking.end_date).toLocaleDateString()}</li>
        <li><strong>Status:</strong> ${booking.status}</li>
      </ul>
      
      <h2>Vehicle Details:</h2>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model}</li>
        <li><strong>License Plate:</strong> ${vehicle.license_plate}</li>
        <li><strong>Status:</strong> ${vehicle.status}</li>
      </ul>
      
      <p>Please review and approve or reject this booking request in the fleet management system.</p>
      
      <p><em>This is an automated notification from the Fleet Management System.</em></p>
    `

    const { data, error } = await resend.emails.send({
      from: 'Fleet Management System <fleet-management@yourdomain.com>',
      to: fleetManagerEmail,
      subject: `New Vehicle Booking Request - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
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