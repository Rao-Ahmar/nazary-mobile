export type UserRole = 'traveler' | 'planner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  profileCompleted: boolean;
  referralCode?: string;
  points?: number;
  completedTripsCount?: number;
  createdAt: string;
}

export interface UserPointsInfo {
  points: number;
  completedTripsCount: number;
  surpriseGiftEligible: boolean;
  freeTripEligible: boolean;
  freeTripPairName?: string;
  referralCode: string;
  referralsCount: number;
  referralBonusPoints: number;
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
  youtubeUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  coverPhoto?: string;
  slug?: string;
  nazaryUrl?: string;
  instagramVerified?: boolean;
  tiktokVerified?: boolean;
  socialVerified?: boolean;
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
  sourceTripId?: string;
  recurringEnabled?: boolean;
  recurringRule?: { day_of_week: number; hour: number };
  myBookingStatus?: string;
  my_booking_status?: string;
  myBookingId?: string;
  my_booking_id?: string;
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

export interface CorporateTripRequest {
  id: string;
  companyName: string;
  estimatedPeople: number;
  contactEmail?: string;
  contactPhone?: string;
  preferredPlannerName?: string;
  specialNotes?: string;
  status: 'pending' | 'in_review' | 'arranged' | 'rejected';
  linkedTripId?: string;
  createdAt: string;
}

// Booking
export interface Booking {
  id: string;
  tripId: string;
  trip_id?: string;
  travelerId: string;
  travelerName: string;
  travelerAvatar?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'approved' | 'payment_submitted' | 'rejected';
  amount: number;
  seats?: number;
  adminNote?: string;
  admin_note?: string;
  tripTitle?: string;
  trip_title?: string;
  tripHeroImage?: string;
  trip_hero_image?: string;
  tripLocation?: string;
  trip_location?: string;
  createdAt: string;
  created_at?: string;
}

// Payment Account (admin-configured payment methods)
export interface PaymentAccount {
  id: string;
  methodType: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  isActive: boolean;
}

// Payment Proof (traveler-submitted payment evidence)
export interface PaymentProof {
  id: string;
  bookingId: string;
  referenceNumber: string;
  amount: number;
  methodUsed: string;
  status: 'submitted' | 'verified' | 'rejected';
  adminNote?: string;
  screenshotUrl?: string;
  verifiedAt?: string;
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
  agencyName: string;
  name: string;
  bio?: string;
  agencyTagline?: string;
  city?: string;
  phone?: string;
  verified: boolean;
  averageRating: number;
  totalTrips: number;
  avatar?: string;
  agencyLogo?: string;
  yearsExperience?: number;
  createdAt: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  coverPhoto?: string;
  slug?: string;
  nazaryUrl?: string;
  instagramVerified?: boolean;
  tiktokVerified?: boolean;
  socialVerified?: boolean;
}

export interface ItineraryPreset {
  id: string;
  name: string;
  days: { day: number; title: string; desc: string }[];
  createdAt: string;
  updatedAt: string;
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
