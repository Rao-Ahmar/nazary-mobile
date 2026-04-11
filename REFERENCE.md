# Nazary Mobile - Reference Guide

> React Native (Expo) mobile app for a Pakistan travel/tourism marketplace.
> Dual-role: Traveler + Planner. Zustand state, Axios API, Material Design 3 inspired.

---

## Tech Stack

- **Framework:** React Native 0.81.5 + Expo ~54.0.33
- **Language:** TypeScript 5.9
- **State:** Zustand 5.0.12
- **HTTP:** Axios 1.14
- **Navigation:** React Navigation 7.x (native-stack + bottom-tabs)
- **Fonts:** Manrope (editorial) + Inter (transactional)
- **UI:** expo-linear-gradient, expo-blur, expo-haptics, react-native-svg
- **API Base:** `http://localhost:3000/api/v1`

---

## App Flow

```
App.tsx (font loading, splash)
  -> AppNavigator
    -> Not authenticated?    -> AuthStack (Onboarding, Login, Signup, ForgotPassword, ResetPassword)
    -> !profileCompleted?    -> ProfileSetupStack (Traveler or Planner setup wizard)
    -> role === 'planner'?   -> PlannerTabs + shared modal screens
    -> role === 'traveler'?  -> TravelerTabs + shared modal screens
```

---

## User Roles

| Role | Tabs | Key Features |
|------|------|-------------|
| `traveler` | Home, Search, MyTrips, Places, Profile | Browse trips, search/filter, book, send trip requests, write reviews, arrange trips |
| `planner` | Dashboard, ManageTrips, Requests, Profile | Create/manage trips, handle bookings, respond to trip requests, edit agency profile |

---

## Design System (theme/tokens.ts)

### Colors
- **Primary:** #0058bc / #0070eb
- **Surface hierarchy:** surfaceContainerLowest (#fff) through surfaceContainerHighest (#e2e2e4) — tonal elevation, no borders
- **Text:** onSurface (#1a1c1d), onSurfaceVariant (#414755)
- **Semantic:** success (#1a7a3a), warning (#f59e0b), error (#ba1a1a)
- **Glass:** rgba(249, 249, 251, 0.80)

### Typography
- **Display:** Manrope_300Light (52/44/36px)
- **Headline:** Manrope_400Regular (32/28/24px)
- **Title:** Manrope_400Regular (22/16/14px)
- **Body:** Inter_300Light (16/14/12px)
- **Label:** Inter_400Regular (14/12/11px)

### Spacing
xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, 3xl=48, 4xl=64

### Radii
sm=8, md=12, lg=16, xl=24, full=999

### Shadows
ambient, soft, card — subtle elevation (low shadowOpacity)

---

## Navigation

### TravelerTabs (5 tabs)
| Tab | Screen | Icon |
|-----|--------|------|
| Home | HomeScreen | compass-outline |
| Search | SearchScreen | search-outline |
| My Trips | MyTripsScreen | airplane-outline |
| Places | PlacesScreen | location-outline |
| Profile | ProfileScreen | person-outline |

### PlannerTabs (4 tabs)
| Tab | Screen | Icon |
|-----|--------|------|
| Dashboard | DashboardScreen | grid-outline |
| Trips | ManageTripsScreen | map-outline |
| Requests | IncomingRequestsScreen | document-text-outline |
| Profile | PlannerProfileScreen | person-outline |

### Shared Modal Screens (in RootStack)
TripDetails, CreateTripRequest, MyTripRequests, IncomingRequests, TripRequestDetail, Notifications, PlannerPublicProfile, WriteReview, Places, PlaceDetail, BikeTrips, BikeTripDetail, BikeRiders, BikeProfileSetup, PremiumPaywall, ArrangeATrip, MyArrangements, CreateTrip, EditPlannerProfile

---

## Screens

### Auth (src/screens/auth/)
| Screen | Description |
|--------|-------------|
| OnboardingScreen | 3-slide carousel with auto-advance, parallax images, CTA buttons |
| LoginScreen | Email/password form, social login placeholders, dev login buttons |
| SignupScreen | Role picker (Traveler/Planner), name/email/password form |
| ForgotPasswordScreen | Email input, calls authApi.forgotPassword(), shows success state |
| ResetPasswordScreen | Token + new password form, calls authApi.resetPassword() |

### Profile Setup (src/screens/profile/)
| Screen | Description |
|--------|-------------|
| TravelerProfileSetupScreen | Single-step: phone number input |
| PlannerProfileSetupScreen | 3-step wizard: agency info -> verification -> finish |

### Traveler (src/screens/traveler/)
| Screen | Description |
|--------|-------------|
| HomeScreen | Greeting, search bar, action cards (Trip Request, Places, Bike), "Arrange a Trip" premium card, category chips, featured trip cards (parallax), curated collections |
| SearchScreen | Search input, category chips, sort options (newest/price), paginated trip list, calls tripsApi.getAll() with fallback to mock |
| MyTripsScreen | Trip requests list with status badges, links to MyTripRequestsScreen |
| ProfileScreen | Avatar, name, email, role badge, logout |

### Planner (src/screens/planner/)
| Screen | Description |
|--------|-------------|
| DashboardScreen | Stats grid (revenue, active trips, bookings, rating), trip cards with progress bars, recent bookings list |
| ManageTripsScreen | Tab filter (All/Active/Draft/Completed), trip list with status badges, publish/edit/delete actions for drafts, + button for CreateTrip |
| PlannerProfileScreen | Avatar, name, email, "Edit Agency Profile" button, logout |
| CreateTripScreen | Full trip form: title, subtitle, location, description, price/seats, dates, duration, tag chips, highlights. Calls tripsApi.create() or .update() |
| EditPlannerProfileScreen | Agency name, tagline, city, phone, years experience, bio. Calls profileApi.updateProfile() |
| BookingRequestsScreen | Incoming booking requests |

### Trip Details (src/screens/)
| Screen | Description |
|--------|-------------|
| TripDetailsScreen | Parallax hero, scroll-driven header, host card, highlights, gallery, itinerary (day-by-day), reviews, sticky "Book Now" bar |

### Trip Requests (src/screens/tripRequests/)
| Screen | Description |
|--------|-------------|
| CreateTripRequestScreen | Destination, dates, seats, category, budget, notes -> sends request to planner |
| MyTripRequestsScreen | Traveler's sent requests with status |
| IncomingRequestsScreen | Planner's received requests with accept/reject |
| TripRequestDetailScreen | Full request detail with actions |

### Reviews (src/screens/reviews/)
| Screen | Description |
|--------|-------------|
| PlannerPublicProfileScreen | Public planner profile with reviews list |
| WriteReviewScreen | Star rating + text input for planner or place reviews |

### Places (src/screens/places/)
| Screen | Description |
|--------|-------------|
| PlacesScreen | Pakistan destinations grid with region filter |
| PlaceDetailScreen | Place info, reviews, map coordinates |

### Bike / Premium (src/screens/bike/)
| Screen | Description |
|--------|-------------|
| BikeTripsScreen | Bike trip listings (gated by premium) |
| BikeTripDetailScreen | Bike trip details |
| BikeRidersScreen | Rider community profiles |
| BikeProfileSetupScreen | Create/edit bike profile (model, cc, experience) |
| PremiumPaywallScreen | Premium subscription prompt |

### Arrangements (src/screens/arrangements/)
| Screen | Description |
|--------|-------------|
| ArrangeATripScreen | Premium feature form: destination (or "Surprise me"), dates, group size stepper, PKR budget range, notes. Calls arrangementApi.create() |
| MyArrangementsScreen | List of arrangement requests with status badges (Pending/In Review/Trip Ready/Rejected) |

### Other
| Screen | Description |
|--------|-------------|
| NotificationsScreen | Notification list with type icons |
| ConversationsScreen | "Messaging Removed" placeholder |

---

## API Layer (src/api/)

### client.ts
Axios instance at `http://localhost:3000/api/v1`, `setAuthToken(token)` for bearer auth.

### auth.ts
`login(email, password)`, `signup(name, email, password, role)`, `logout()`, `getCurrentUser()`, `forgotPassword(email)`, `resetPassword(token, password)`, `refresh(refreshToken)`

### profile.ts
`updateProfile(data)`, `uploadAvatar(formData)`, `uploadAgencyLogo(formData)`, `registerDeviceToken(token)`, `getUser(id)`

### trips.ts
`getAll(params)` (q, tag, min_price, max_price, sort), `getFeatured()`, `getById(id)`, `getMyTrips(page)`, `create(data)`, `update(id, data)`, `destroy(id)`, `publish(id)`, `complete(id)`

### tripRequests.ts
**Traveler:** `create(data)`, `getMyRequests(page, status?)`, `cancel(id)`
**Planner:** `getIncoming(page, status?)`, `accept(id)`, `reject(id)`

### notifications.ts
`getAll(page)`, `markRead(id)`, `readAll()`

### reviews.ts
`getPlannerReviews(userId, page)`, `createPlannerReview(data)`, `getPlaceReviews(placeId, page)`, `createPlaceReview(placeId, data)`

### places.ts
`getAll(page, region?)`, `getById(id)`

### bikeTrips.ts
`getTrips(page)`, `getRiders(page, experienceLevel?)`, `getProfile()`, `createProfile(data)`, `updateProfile(data)`

### planners.ts
`getProfile(id)`

### arrangements.ts
`create(data)`, `getMyRequests()`

---

## State Management (src/store/) — Zustand

### authStore
**State:** user, token, refreshToken, role, isAuthenticated, isLoading, profileCompleted
**Actions:** login(), signup() (both throw on error), logout(), setProfileCompleted(), setUser(), devLoginAsTraveler(), devLoginAsPlanner()

### notificationStore
**State:** notifications[], unreadCount, fcmToken, isLoading
**Actions:** fetchNotifications(), markAsRead(id), markAllRead(), setFcmToken()

### tripRequestStore
**State:** myRequests[], incomingRequests[], isLoading
**Actions:** fetchMyRequests(), fetchIncoming(), cancelRequest(), acceptRequest(), rejectRequest(), addRequest()
**Note:** Currently uses mock data, ready for API integration

### bikeStore
**State:** bikeTrips[], bikeRiders[], bikeProfile, isPremiumUnlocked, isLoading
**Actions:** fetchBikeTrips(), fetchRiders(), fetchProfile(), setPremium(), setBikeProfile()

### arrangementStore
**State:** arrangements[], isLoading
**Actions:** fetchArrangements() (API with mock fallback)

---

## Components (src/components/)

| Component | Description |
|-----------|-------------|
| GlassCard | Blur-based card |
| PremiumButton | Gradient CTA button |
| AnimatedImage | Image with loading animation |
| SectionHeader | Section title + "SEE ALL" link |
| TabBarIcon | Ionicons wrapper for tab bar |
| LoadingScreen | Full-screen spinner with branding |
| RolePicker | Traveler/Planner toggle for signup |
| FormInput | Input with icon + label |
| StarRating | 5-star rating display |
| ReviewCard | Review with avatar, stars, text |
| StatusBadge | Colored badge (pending/accepted/rejected/cancelled) |
| NotificationBell | Bell icon with unread count badge |
| CategoryChip | Filter chip |
| EmptyState | Empty list placeholder |

---

## Data Types (src/types/models.ts)

| Type | Key Fields |
|------|-----------|
| User | id, name, email, role, avatar, phone, profileCompleted |
| TripPlanner | extends User + bio, guild, rating, agencyName, agencyTagline, yearsExperience, plannerRating |
| Trip | id, title, location, heroImage, gallery[], price, currency, duration, dates, totalSeats, seatsLeft, status, tags[], rating, host{}, highlights[], itinerary[] |
| CustomTripRequest | traveler/planner info, destination, dates, seats, budget, status |
| AppNotification | title, body, notificationType, data, read |
| Place | name, region, description, lat/lng, coverImage, rating, reviewCount |
| Review / PlaceReview / PlannerReview | rating, text, user info |
| BikeProfile / BikeRider | bikeModel, bikeCc, experienceLevel, bio |
| Conversation / Message | DEPRECATED - removed in v1 |

---

## Mock Data (src/data/mockData.ts)

- 3 onboarding slides
- 3 featured trips (Altai, Tuscany, Patagonia)
- 7 categories (All, Adventure, Cultural, Wellness, Culinary, Safari, Bike)
- 3 curated collections (Winter Escapes, Island Hopping, Mountain Highs)
- 1 full trip detail object (The Altai Expedition — 8 days, 5 itinerary days, 3 reviews)
- Agency stats (revenue: $124.5k, 8 active trips, 47 bookings, 4.9 rating)
- 4 agency trips with bookings/capacity/revenue
- 3 recent bookings

---

## Animation Patterns

- **Staggered fade-in:** `useStaggeredFadeIn(count, baseDelay, stagger)` — cards appear one after another
- **Fade-in-up:** opacity 0->1 + translateY 20->0 with Easing.out(Easing.cubic)
- **Parallax hero:** scrollY-driven scale + translateY on TripDetailsScreen
- **Scroll-driven header:** opacity tied to scroll position
- **Blur overlays:** BlurView for glass effects (iOS) with fallback backgrounds

---

## Directory Structure

```
src/
  types/
    models.ts          (User, Trip, Booking, Review, Place, Notification, etc.)
    navigation.ts      (AuthStack, TravelerTab, PlannerTab, RootStack param lists)
    index.ts
  theme/
    tokens.ts          (colors, typography, spacing, radii, shadows)
    index.ts
  api/
    client.ts          (Axios instance + setAuthToken)
    auth.ts, profile.ts, trips.ts, tripRequests.ts, notifications.ts,
    reviews.ts, places.ts, bikeTrips.ts, planners.ts, arrangements.ts
    index.ts
  store/
    authStore.ts, notificationStore.ts, tripRequestStore.ts,
    bikeStore.ts, arrangementStore.ts
    index.ts
  navigation/
    AppNavigator.tsx, AuthStack.tsx, ProfileSetupStack.tsx,
    TravelerTabs.tsx, PlannerTabs.tsx
  screens/
    auth/              (Onboarding, Login, Signup, ForgotPassword, ResetPassword)
    profile/           (TravelerProfileSetup, PlannerProfileSetup)
    traveler/          (Home, Search, MyTrips, Profile)
    planner/           (Dashboard, ManageTrips, PlannerProfile, EditPlannerProfile, CreateTrip, BookingRequests)
    tripRequests/      (Create, MyRequests, Incoming, Detail)
    reviews/           (PlannerPublicProfile, WriteReview)
    places/            (Places, PlaceDetail)
    bike/              (BikeTrips, BikeTripDetail, BikeRiders, BikeProfileSetup, PremiumPaywall)
    arrangements/      (ArrangeATrip, MyArrangements)
    notifications/     (NotificationsScreen)
    shared/            (TripDetailsScreen, ChatScreen, ConversationsScreen)
    index.ts
  components/
    GlassCard, PremiumButton, AnimatedImage, SectionHeader, TabBarIcon,
    LoadingScreen, RolePicker, FormInput, StarRating, ReviewCard,
    StatusBadge, NotificationBell, CategoryChip, EmptyState
    index.ts
  data/
    mockData.ts
  utils/
    notifications.ts   (registerForPushNotifications)
  hooks/
    useAnimatedEntry.ts (useFadeInUp, useScaleIn, useFadeIn)
```

---

## Removed Features (Nazary v1)

**Messaging:** Conversation/Message models deprecated, Messages tab removed from both Traveler and Planner tabs. Replaced with Places tab for travelers. Contact between traveler and agency now happens via phone call after trip request is accepted.

---

## Dev Shortcuts

- **Dev login buttons** on LoginScreen bypass auth for testing both roles
- **Mock data fallbacks** in stores and some screens when API is unreachable
- `isPremiumUnlocked` defaults to true in bikeStore for dev testing
