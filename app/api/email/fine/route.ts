import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { fine, vehicle } = await request.json()

    if (!fine || !vehicle) {
      return NextResponse.json(
        { error: 'Missing fine or vehicle data' },
        { status: 400 }
      )
    }

    const emailContent = `
      <h1>Traffic Fine Notification</h1>
      
      <h2>Fine Details:</h2>
      <ul>
        <li><strong>Date:</strong> ${new Date(fine.fine_date).toLocaleDateString()}</li>
        <li><strong>Amount:</strong> $${fine.amount.toLocaleString()}</li>
        <li><strong>Status:</strong> ${fine.status}</li>
        <li><strong>Reason:</strong> ${fine.reason}</li>
      </ul>
      
      <h2>Vehicle Details:</h2>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model}</li>
        <li><strong>License Plate:</strong> ${vehicle.license_plate}</li>
      </ul>
      
      <p>Please address this traffic fine promptly. If you have any questions or believe this is an error, please contact the fleet management team.</p>
      
      <p><em>This is an automated notification from the Fleet Management System.</em></p>
    `

    const { data, error } = await resend.emails.send({
      from: 'Fleet Management System <fleet-management@yourdomain.com>',
      to: fine.staff_email,
      subject: `Traffic Fine Notification - $${fine.amount.toLocaleString()} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
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
