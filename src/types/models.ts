export type UserRole = 'traveler' | 'planner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  profileCompleted: boolean;
  createdAt: string;
}

export interface TripPlanner extends User {
  role: 'planner';
  bio?: string;
  guild?: string;
  rating: number;
  tripsHosted: number;
  totalReviews: number;
  agencyName?: string;
  agencyTagline?: string;
  yearsExperience?: number;
  agencyLogo?: string;
  plannerRating: number;
}

export interface PlannerProfile {
  id: string;
  name: string;
  avatar?: string;
  agencyName?: string;
  agencyTagline?: string;
  agencyLogo?: string;
  yearsExperience?: number;
  bio?: string;
  guild?: string;
  rating: number;
  plannerRating: number;
  tripsHosted: number;
  totalReviews: number;
}

export interface TravelerProfile {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  profileCompleted: boolean;
}

export interface Trip {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  heroImage: string;
  gallery: string[];
  price: number;
  currency: string;
  duration: string;
  dates: string;
  totalSeats: number;
  seatsLeft: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  tags: string[];
  rating: number;
  reviewCount: number;
  host: {
    id: string;
    name: string;
    avatar: string;
    guild?: string;
    rating: number;
  };
  highlights: string[];
  itinerary: { day: string; title: string; desc: string }[];
  tripType?: 'casual' | 'family' | 'bike_trip' | 'couple_trip';
  isPremium?: boolean;
  createdAt: string;
  contentUpdatedAt?: string;
  isUpdated?: boolean;
}

export interface CoupleRequest {
  id: string;
  userId: string;
  partnerName: string;
  destinationPreference: string;
  travelDates: string;
  budgetRange: string;
  specialRequests?: string;
  status: 'pending' | 'reviewing' | 'arranged' | 'rejected';
  linkedTripId?: string;
  createdAt: string;
}

// Booking (legacy - existing bookings for trips)
export interface Booking {
  id: string;
  tripId: string;
  travelerId: string;
  travelerName: string;
  travelerAvatar?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount: number;
  createdAt: string;
}

// Custom Trip Request (traveler -> planner)
export interface CustomTripRequest {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerAvatar?: string;
  travelerPhone?: string;
  plannerId: string;
  plannerName: string;
  plannerAvatar?: string;
  plannerPhone?: string;
  destination: string;
  startDate: string;
  endDate: string;
  seats: number;
  category?: string;
  budget?: number;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

/** @deprecated REMOVED: messaging feature — Nazary v1 */
export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  tripContext?: string;
}

/** @deprecated REMOVED: messaging feature — Nazary v1 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Review {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  notificationType: 'trip_reminder' | 'booking_update' | 'request_update' | 'review' | 'general' | 'bike_trip' | 'trip_update' | 'new_trip' | 'preference_match';
  data: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface TripUpdate {
  id: string;
  changes: Record<string, { from: string; to: string }>;
  editorName: string;
  createdAt: string;
}

export interface Place {
  id: string;
  name: string;
  region: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  coverImage?: string;
  rating: number;
  reviewCount: number;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
}

export interface PlannerReview {
  id: string;
  plannerId: string;
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
}

export interface BikeProfile {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bikeModel: string;
  bikeCc: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  bio?: string;
}

export interface Agency {
  id: string;
  agency_name: string;
  name: string;
  bio?: string;
  agency_tagline?: string;
  city?: string;
  phone?: string;
  verified: boolean;
  average_rating: number;
  total_trips: number;
  avatar?: string;
  agency_logo?: string;
  years_experience?: number;
  created_at: string;
  youtube_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  website_url?: string;
  cover_photo?: string;
}

export type BikeTrip = Trip; // Bike trips are regular trips tagged with "Bike"

export interface BikeRider {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bikeModel: string;
  bikeCc: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  bio?: string;
}
