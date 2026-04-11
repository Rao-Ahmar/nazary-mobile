export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type ProfileSetupStackParamList = {
  PlannerProfileSetup: undefined;
  TravelerProfileSetup: undefined;
  OtpVerification: { phoneNumber: string };
};

export type TravelerTabParamList = {
  Home: undefined;
  Search: undefined;
  MyTrips: undefined;
  // REMOVED: messaging feature — Nazary v1
  // Messages: undefined;
  Agencies: undefined;
  Profile: undefined;
};

export type PlannerTabParamList = {
  Dashboard: undefined;
  ManageTrips: undefined;
  Requests: undefined;
  // REMOVED: messaging feature — Nazary v1
  // Messages: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  TravelerTabs: undefined;
  PlannerTabs: undefined;
  TripDetails: { tripId?: string };
  OtpVerification: { phoneNumber: string };
  // REMOVED: messaging feature — Nazary v1
  // Conversations: undefined;
  // Chat: { conversationId?: string };
  CreateTripRequest: { plannerId?: string };
  MyTripRequests: undefined;
  IncomingRequests: undefined;
  TripRequestDetail: { requestId: string };
  Notifications: undefined;
  PlannerPublicProfile: { plannerId: string };
  AgencyDetail: { agencyId: string };
  WriteReview: { type: 'planner' | 'place'; targetId: string; targetName: string };
  Places: undefined;
  PlaceDetail: { placeId: string };
  BikeTrips: undefined;
  BikeTripDetail: { tripId: string };
  BikeRiders: undefined;
  BikeProfileSetup: undefined;
  PremiumPaywall: undefined;
  ArrangeATrip: undefined;
  MyArrangements: undefined;
  CreateTrip: { tripId?: string };
  EditPlannerProfile: undefined;
  CoupleRequest: undefined;
  Settings: undefined;
};
