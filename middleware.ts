import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip authentication for testing - allows open access to the system
  // TODO: Implement proper authentication when needed for production
  return NextResponse.next()
}

export const config = {
  matcher: [], // Disable middleware for now
}
