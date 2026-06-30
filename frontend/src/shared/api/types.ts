// Typed mirror of the backend's serializer contracts.
// Keep this in lock-step with backend/sessions|profiles|bookings|accounts/serializers.py

export type Role = "user" | "creator";

export interface AppUser {
  id: string;
  email: string;
  role: Role;
  is_creator: boolean;
  created_at: string;
}

export interface CreatorSummary extends AppUser {
  full_name: string;
  avatar_url: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  user: AppUser;
  profile: Profile;
}

export interface Tag {
  id: string;
  name: string;
}

export interface SessionImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export type SessionStatus = "draft" | "published" | "unpublished" | "archived";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LocationType = "online" | "in_person" | "hybrid";

export interface Session {
  id: string;
  creator: CreatorSummary;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  duration_minutes: number;
  price: string; // Decimal serialized as string by DRF
  currency: string;
  capacity: number;
  scheduled_at: string | null;
  location_type: LocationType;
  status: SessionStatus;
  thumbnail_url: string;
  tags: Tag[];
  images: SessionImage[];
  bookings_count: number;
  is_bookable: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "canceled"
  | "failed"
  | "refunded";

export type PaymentStatus =
  | "not_required"
  | "pending"
  | "paid"
  | "refunded"
  | "failed";

export interface Booking {
  id: string;
  session: Session;
  status: BookingStatus;
  booked_at: string;
  canceled_at: string | null;
  amount_paid: string;
  currency: string;
  payment_status: PaymentStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Backend error envelope.
export interface ApiErrorEnvelope {
  error: {
    code: string;
    detail: string | Record<string, unknown> | unknown[];
    status: number;
  };
}
