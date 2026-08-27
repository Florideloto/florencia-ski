export type Locale = 'en' | 'es' | 'th';

export interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export type Resort = 'Hakuba' | 'Myoko' | 'Shiga Kogen' | 'Other';

export interface BlockedDate {
  id: string;
  date: string;
  note: string;
  created_at: string;
}

export interface BookingRequest {
  id: string;
  slot_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_type: 'private' | 'kids' | 'offPiste';
  duration: '3h' | '4h' | 'halfDay' | 'fullDay' | null;
  resort: Resort | null;
  resort_other: string;
  message: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  slot?: AvailabilitySlot;
  /** All days linked to this booking (via booking_request_slots), when fetched */
  slots?: AvailabilitySlot[];
}

export interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  image_url: string | null;
  approved: boolean;
  created_at: string;
}
