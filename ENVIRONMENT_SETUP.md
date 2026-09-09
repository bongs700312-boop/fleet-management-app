# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend Email Service Configuration
RESEND_API_KEY=your_resend_api_key

# Fleet Manager Email (for booking notifications)
FLEET_MANAGER_EMAIL=fleet-manager@yourcompany.com
```

## Setup Instructions

### 1. Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Navigate to Project Settings > API
4. Copy your Project URL and Anon Key
5. Paste them into the `.env.local` file

### 2. Resend Email Configuration
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Create an account and get your API key
3. Add your API key to the `.env.local` file
4. Verify your domain in Resend settings

### 3. Fleet Manager Email
- Set the email address where booking notifications should be sent
- This should be your fleet manager or admin email

## Optional Configuration

```bash
# Custom Email From Address
# If not set, defaults to: fleet-management@yourdomain.com
EMAIL_FROM_ADDRESS=fleet-management@yourcompany.com
```

## Database Setup

After setting up environment variables, run the database setup script:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the script from `database-setup.sql`

This will create the required tables:
- `carwashes` table
- Verify and create `fines` table if needed
- Set up proper indexes and relationships

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test email functionality by creating a booking
3. Check that notifications are received at the fleet manager email

## Security Notes

- Never commit `.env.local` to version control
- Never share your API keys
- Rotate API keys periodically
- Use different API keys for development and production
