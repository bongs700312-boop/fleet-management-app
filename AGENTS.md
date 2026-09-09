<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fleet Management System - Project Setup Guide

## Development Commands

### Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Linting
```bash
npm run lint
```

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

The project uses:
- Next.js 16.3.4 (latest version with breaking changes)
- Supabase for database and authentication
- Resend for email notifications
- jsPDF for PDF report generation
- Lucide React for icons

### 2. Environment Configuration
Create a `.env.local` file in the root directory. See `ENVIRONMENT_SETUP.md` for detailed instructions.

Required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
FLEET_MANAGER_EMAIL=fleet-manager@yourcompany.com
```

### 3. Database Setup
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the script from `database-setup.sql`

This creates the required tables:
- `vehicles` - Fleet vehicle information
- `bookings` - Vehicle booking requests
- `inspections` - Pre-trip and post-trip inspections
- `fines` - Traffic violation records
- `carwashes` - Vehicle wash records
- `company_rules` - Company policies for booking

## Application Structure

### Pages and Features
- **Dashboard** (`/`) - Overview with real-time KPIs and recent activity
- **Rules & Booking** (`/rules-booking`) - Company rules and vehicle booking form
- **Check-In/out Inspections** (`/inspections`) - Pre-trip and post-trip vehicle inspections
- **Vehicles & Services** (`/vehicles`) - Fleet management and service scheduling
- **Fines** (`/fines`) - Traffic fine logging with email notifications
- **Carwash** (`/carwash`) - Carwash record logging with cost tracking
- **Executive Reports** (`/reports`) - Leadership dashboard with PDF/CSV exports

### Key Features
- Real-time dashboard with live data
- Email notifications for bookings and fines
- PDF and CSV report generation
- Vehicle service tracking and alerts
- Inspection workflow management
- Financial tracking (fines, carwash costs)

## Database Schema

### Core Tables
- **vehicles**: Vehicle information, mileage, service schedules
- **bookings**: Booking requests with approval workflow
- **inspections**: Pre-trip and post-trip inspection records
- **fines**: Traffic violations with status tracking
- **carwashes**: Carwash records with cost tracking
- **company_rules**: Company policies for vehicle usage

### Relationships
- bookings → vehicles (many-to-one)
- inspections → bookings (optional), inspections → vehicles (many-to-one)
- fines → vehicles (many-to-one)
- carwashes → vehicles (many-to-one)

## Testing Checklist

### Manual Testing Steps
1. **Dashboard**: Verify all KPIs display correctly with real data
2. **Booking System**: 
   - Create a booking request
   - Verify email notification is sent
   - Check booking status updates
3. **Inspections**:
   - Complete pre-trip check-out
   - Complete post-trip check-in
   - Verify vehicle status updates
4. **Vehicles**:
   - Add new vehicle
   - Update vehicle information
   - Check service alerts
5. **Fines**:
   - Log a new fine
   - Verify email notification to staff
   - Check fine status updates
6. **Carwash**:
   - Log carwash record
   - Verify cost tracking
   - Check monthly totals
7. **Reports**:
   - Generate PDF reports
   - Export CSV data
   - Verify data accuracy

## Troubleshooting

### Common Issues

**Email notifications not working:**
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for API usage
- Verify domain is verified in Resend

**Database connection errors:**
- Check Supabase URL and anon key
- Verify Supabase project is active
- Check RLS policies in Supabase

**Build errors:**
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Clear Next.js cache: `rm -rf .next`

**PDF generation issues:**
- Verify jsPDF and jspdf-autotable are installed
- Check browser compatibility
- Test in different browsers

## Development Notes

### Code Patterns
- Use Supabase client for all database operations
- Follow existing component structure for consistency
- Use Lucide React icons throughout
- Maintain responsive design with Tailwind CSS
- Handle loading and error states consistently

### State Management
- Use React hooks for local state
- Supabase real-time subscriptions can be added for live updates
- Form state managed with controlled components

### Styling
- Use Tailwind CSS utility classes
- Follow existing color scheme and spacing
- Maintain consistent component styling
- Ensure mobile responsiveness

## Production Deployment

### Deployment Checklist
1. Set production environment variables
2. Run database migrations in production Supabase
3. Build the application: `npm run build`
4. Test production build locally: `npm start`
5. Deploy to your hosting platform (Vercel, Netlify, etc.)
6. Configure custom domain if needed
7. Set up monitoring and error tracking
8. Test all functionality in production

### Environment Variables for Production
- Use different Supabase project for production
- Use production Resend API key
- Set appropriate email addresses
- Enable any production-specific features
