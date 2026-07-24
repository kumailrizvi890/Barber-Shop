export type Role = "customer" | "barber";
export type BookingStatus = "pending" | "approved" | "declined" | "completed";
export type PostType = "image" | "video";

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  initials: string;
  rating: number;
  cuts_done: number;
  created_at: string;
}

export interface BarberService {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface Availability {
  id: string;
  barber_id: string;
  weekday: number; // 0-6, Sun-Sat
  slot_index: number; // 0-8, maps to TIME_SLOTS
  blocked: boolean;
}

export interface Booking {
  id: string;
  customer_id: string;
  barber_id: string;
  service_id: string | null;
  service_name: string;
  price: number;
  date: string; // ISO date
  time: string; // e.g. "10:00 AM"
  status: BookingStatus;
  rating: number | null;
  reminder_sent: boolean;
  created_at: string;
  // joined
  customer?: Profile;
  barber?: Profile;
}

export interface Post {
  id: string;
  barber_id: string;
  media_url: string;
  type: PostType;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  hidden: boolean;
  created_at: string;
  // joined
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  text: string;
  icon: string;
  read: boolean;
  created_at: string;
}

export interface Reward {
  user_id: string;
  points: number;
}

export type RedemptionStatus = "pending" | "used";

export interface RewardRedemption {
  id: string;
  user_id: string;
  points: number;
  status: RedemptionStatus;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  // joined
  customer?: Profile;
}

// Minimal Database type placeholder so @supabase/ssr generics are satisfied.
// Replace with `supabase gen types typescript` output for full type safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
