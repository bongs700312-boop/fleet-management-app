export type Database = {
  public: {
    Tables: {
      company_rules: {
        Row: {
          id: string
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          vehicle_id: string
          user_email: string
          start_date: string
          end_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_progress'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_email: string
          start_date: string
          end_date: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_progress'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          user_email?: string
          start_date?: string
          end_date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_progress'
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          make: string
          model: string
          year: number
          license_plate: string
          status: 'available' | 'booked' | 'maintenance'
          current_mileage: number
          last_service_mileage: number
          next_service_mileage: number
          last_service_date: string | null
          next_service_date: string | null
          license_disk_expiry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          make: string
          model: string
          year: number
          license_plate: string
          status?: 'available' | 'booked' | 'maintenance'
          current_mileage?: number
          last_service_mileage?: number
          next_service_mileage?: number
          last_service_date?: string | null
          next_service_date?: string | null
          license_disk_expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string
          status?: 'available' | 'booked' | 'maintenance'
          current_mileage?: number
          last_service_mileage?: number
          next_service_mileage?: number
          last_service_date?: string | null
          next_service_date?: string | null
          license_disk_expiry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          booking_id: string | null
          vehicle_id: string
          inspection_type: 'pre_trip' | 'post_trip'
          inspector_name: string
          start_km: number | null
          end_km: number | null
          condition_notes: string
          issues_found: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          vehicle_id: string
          inspection_type: 'pre_trip' | 'post_trip'
          inspector_name: string
          start_km?: number | null
          end_km?: number | null
          condition_notes: string
          issues_found: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          vehicle_id?: string
          inspection_type?: 'pre_trip' | 'post_trip'
          inspector_name?: string
          start_km?: number | null
          end_km?: number | null
          condition_notes?: string
          issues_found?: string
          created_at?: string
          updated_at?: string
        }
      }
      fines: {
        Row: {
          id: string
          vehicle_id: string
          staff_email: string
          fine_date: string
          amount: number
          reason: string
          status: 'pending' | 'paid' | 'disputed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          staff_email: string
          fine_date: string
          amount: number
          reason: string
          status?: 'pending' | 'paid' | 'disputed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          staff_email?: string
          fine_date?: string
          amount?: number
          reason?: string
          status?: 'pending' | 'paid' | 'disputed'
          created_at?: string
          updated_at?: string
        }
      }
      carwashes: {
        Row: {
          id: string
          vehicle_id: string
          staff_name: string
          wash_date: string
          cost: number
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          staff_name: string
          wash_date: string
          cost: number
          notes: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          staff_name?: string
          wash_date?: string
          cost?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      petrol_fillups: {
        Row: {
          id: string
          vehicle_id: string
          staff_name: string
          fillup_date: string
          amount: number
          liters: number
          price_per_liter: number
          odometer_reading: number
          fuel_station: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          staff_name: string
          fillup_date: string
          amount: number
          liters: number
          price_per_liter: number
          odometer_reading?: number
          fuel_station?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          staff_name?: string
          fillup_date?: string
          amount?: number
          liters?: number
          price_per_liter?: number
          odometer_reading?: number
          fuel_station?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [key: string]: {
        Row: {}
      }
    }
    Functions: {
      [key: string]: {
        Args: {}
        Returns: {}
      }
    }
    Enums: {
      [key: string]: {}
    }
  }
}
