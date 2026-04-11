# Nazary — Rails 8 API Backend Design

> Complete backend specification for the Nazary mobile app.
> Pakistan-based trip planning platform. Rails 8, API-only, PostgreSQL, JWT auth, Active Storage, Action Cable.

---

## 1. Project Bootstrap

```bash
rails new nazary-api --api --database=postgresql -T   # -T to skip minitest, use rspec
cd nazary-api
```

### Key Gems

```ruby
# Gemfile
gem "bcrypt", "~> 3.1"            # has_secure_password
gem "jwt"                          # Token auth
gem "rack-cors"                    # CORS for mobile client
gem "active_model_serializers"     # JSON serialization (or jbuilder)
gem "kaminari"                     # Pagination
gem "pg_search"                    # Full-text search on trips
gem "image_processing", "~> 1.2"  # Active Storage variants
gem "aws-sdk-s3"                   # S3 storage in production
gem "redis"                        # Action Cable + caching

group :development, :test do
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
  gem "shoulda-matchers"
  gem "database_cleaner-active_record"
end
```

### Initial Config

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"   # lock down in production
    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      expose: ["Authorization"]
  end
end
```

---

## 2. Database Schema

### 2.1 users

| Column          | Type      | Constraints                                       |
|-----------------|-----------|---------------------------------------------------|
| id              | bigint PK | auto                                              |
| name            | string    | NOT NULL                                          |
| email           | string    | NOT NULL, UNIQUE, index                           |
| password_digest | string    | NOT NULL (bcrypt)                                 |
| role            | integer   | NOT NULL, default: 0 (enum)                       |
| phone           | string    | NOT NULL for planners, nullable for travelers     |
| bio             | text      | nullable (planners)                               |
| guild           | string    | nullable (planners)                               |
| online          | boolean   | default: false                                    |
| notifications_enabled | boolean | default: true, NOT NULL                           |
| youtube_url     | string    | nullable (planners)                               |
| instagram_url   | string    | nullable (planners)                               |
| tiktok_url      | string    | nullable (planners)                               |
| twitter_url     | string    | nullable (planners)                               |
| website_url     | string    | nullable (planners)                               |
| created_at      | datetime  |                                                   |
| updated_at      | datetime  |                                                   |

**Avatar**: Active Storage attachment (`has_one_attached :avatar`)
**Cover Photo**: Active Storage attachment (`has_one_attached :cover_photo`)

**Enum**:
```ruby
enum :role, { traveler: 0, planner: 1 }
```

**Validation** (planners must have phone):
```ruby
validates :phone, presence: true, if: :planner?
```

### 2.2 trips

| Column         | Type      | Constraints                               |
|----------------|-----------|-------------------------------------------|
| id             | bigint PK | auto                                      |
| user_id        | bigint FK | NOT NULL, index (host — must be planner)  |
| title          | string    | NOT NULL                                  |
| subtitle       | string    | nullable                                  |
| description    | text      | NOT NULL                                  |
| location       | string    | NOT NULL                                  |
| price          | decimal   | NOT NULL, precision: 10, scale: 2         |
| currency       | string    | NOT NULL, default: "PKR"                  |
| duration       | string    | NOT NULL (e.g. "5 days")                  |
| start_date     | date      | NOT NULL                                  |
| end_date       | date      | NOT NULL                                  |
| total_seats    | integer   | NOT NULL                                  |
| status         | integer   | NOT NULL, default: 0 (enum)               |
| highlights     | text[]    | PostgreSQL array                          |
| tags           | string[]  | PostgreSQL array, index (GIN)             |
| driver_name    | string    | nullable                                  |
| driver_phone   | string    | nullable                                  |
| driver_vehicle | string    | nullable (e.g. "Toyota Coaster - White")  |
| created_at     | datetime  |                                           |
| updated_at     | datetime  |                                           |

**Images**: Active Storage
```ruby
has_one_attached :hero_image
has_many_attached :gallery
```

**Enum**:
```ruby
enum :status, { draft: 0, active: 1, completed: 2, cancelled: 3 }
```

**Computed**:
- `seats_left` → `total_seats - bookings.confirmed.count`
- `rating` → `reviews.average(:rating)`
- `review_count` → `reviews.count`
- `dates` → formatted from `start_date` / `end_date`

### 2.3 itinerary_days

| Column  | Type      | Constraints          |
|---------|-----------|----------------------|
| id      | bigint PK | auto                 |
| trip_id | bigint FK | NOT NULL, index      |
| day     | integer   | NOT NULL             |
| title   | string    | NOT NULL             |
| desc    | text      | NOT NULL             |

```ruby
default_scope { order(:day) }
```

### 2.4 bookings

| Column     | Type      | Constraints                                        |
|------------|-----------|----------------------------------------------------|
| id         | bigint PK | auto                                               |
| trip_id    | bigint FK | NOT NULL, index                                    |
| user_id    | bigint FK | NOT NULL, index (traveler)                         |
| status     | integer   | NOT NULL, default: 0 (enum)                        |
| amount     | decimal   | NOT NULL, precision: 10, scale: 2                  |
| seats      | integer   | NOT NULL, default: 1                               |
| note       | text      | nullable (traveler message to planner)             |
| created_at | datetime  |                                                    |
| updated_at | datetime  |                                                    |

**Unique index**: `[trip_id, user_id]` — one booking per traveler per trip

**Enum**:
```ruby
enum :status, { pending: 0, confirmed: 1, cancelled: 2 }
```

### 2.5 reviews

| Column     | Type      | Constraints                                    |
|------------|-----------|------------------------------------------------|
| id         | bigint PK | auto                                           |
| trip_id    | bigint FK | NOT NULL, index                                |
| user_id    | bigint FK | NOT NULL, index (reviewer — traveler)          |
| rating     | integer   | NOT NULL, 1..5                                 |
| text       | text      | NOT NULL                                       |
| created_at | datetime  |                                                |
| updated_at | datetime  |                                                |

**Unique index**: `[trip_id, user_id]` — one review per traveler per trip

### 2.6 conversations

| Column     | Type      | Constraints                      |
|------------|-----------|----------------------------------|
| id         | bigint PK | auto                             |
| trip_id    | bigint FK | nullable, index (trip context)   |
| created_at | datetime  |                                  |
| updated_at | datetime  |                                  |

### 2.7 conversation_participants

| Column          | Type      | Constraints                         |
|-----------------|-----------|-------------------------------------|
| id              | bigint PK | auto                                |
| conversation_id | bigint FK | NOT NULL, index                     |
| user_id         | bigint FK | NOT NULL, index                     |

**Unique index**: `[conversation_id, user_id]`

### 2.8 messages

| Column          | Type      | Constraints                  |
|-----------------|-----------|------------------------------|
| id              | bigint PK | auto                         |
| conversation_id | bigint FK | NOT NULL, index              |
| sender_id       | bigint FK | NOT NULL (user)              |
| body            | text      | NOT NULL                     |
| read            | boolean   | default: false               |
| created_at      | datetime  |                              |
| updated_at      | datetime  |                              |

### 2.9 categories

| Column | Type      | Constraints        |
|--------|-----------|--------------------|
| id     | bigint PK | auto               |
| label  | string    | NOT NULL, UNIQUE   |
| icon   | string    | NOT NULL           |

### 2.10 collections

| Column     | Type      | Constraints       |
|------------|-----------|-------------------|
| id         | bigint PK | auto              |
| title      | string    | NOT NULL          |
| subtitle   | string    | nullable          |
| created_at | datetime  |                   |
| updated_at | datetime  |                   |

**Image**: `has_one_attached :cover_image`

### 2.11 collection_trips (join)

| Column        | Type      | Constraints            |
|---------------|-----------|------------------------|
| collection_id | bigint FK | NOT NULL, index        |
| trip_id       | bigint FK | NOT NULL, index        |

### 2.12 trip_preferences

| Column              | Type      | Constraints                                           |
|---------------------|-----------|-------------------------------------------------------|
| id                  | bigint PK | auto                                                  |
| user_id             | bigint FK | NOT NULL, UNIQUE index, foreign key to users          |
| budget_min          | decimal   | precision: 10, scale: 2, nullable                    |
| budget_max          | decimal   | precision: 10, scale: 2, nullable                    |
| preferred_months    | integer[] | PostgreSQL array, default: [], GIN index              |
| followed_agency_id  | bigint FK | nullable, foreign key to users                        |
| created_at          | datetime  |                                                       |
| updated_at          | datetime  |                                                       |

**Validations**:
- `user_id` uniqueness (one preference per user)
- `budget_max` must be greater than `budget_min` (when both present)
- `followed_agency` must be a planner role user

---

## 3. Models & Associations

```ruby
class User < ApplicationRecord
  has_secure_password

  enum :role, { traveler: 0, planner: 1 }

  has_one_attached :avatar
  has_one_attached :cover_photo

  # Planner associations
  has_many :trips, dependent: :destroy                         # trips I host
  has_many :received_bookings, through: :trips, source: :bookings

  # Traveler associations
  has_many :bookings, dependent: :destroy                      # trips I booked
  has_many :booked_trips, through: :bookings, source: :trip
  has_many :reviews, dependent: :destroy

  # Messaging
  has_many :conversation_participants, dependent: :destroy
  has_many :conversations, through: :conversation_participants
  has_many :sent_messages, class_name: "Message", foreign_key: :sender_id

  # Trip preferences
  has_one :trip_preference, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :role, presence: true
  validates :phone, presence: true, if: :planner?
end

class Trip < ApplicationRecord
  belongs_to :host, class_name: "User", foreign_key: :user_id

  has_one_attached :hero_image
  has_many_attached :gallery

  has_many :itinerary_days, -> { order(:day) }, dependent: :destroy
  has_many :bookings, dependent: :destroy
  has_many :confirmed_travelers, -> { confirmed }, class_name: "Booking"
  has_many :reviews, dependent: :destroy
  has_many :collection_trips, dependent: :destroy
  has_many :collections, through: :collection_trips
  has_many :conversations

  enum :status, { draft: 0, active: 1, completed: 2, cancelled: 3 }

  validates :title, :description, :location, :price, :duration,
            :start_date, :end_date, :total_seats, presence: true

  scope :featured, -> { active.order(created_at: :desc).limit(10) }
  scope :by_category, ->(tag) { where("? = ANY(tags)", tag) }

  def seats_left
    total_seats - bookings.confirmed.sum(:seats)
  end

  def average_rating
    reviews.average(:rating)&.round(1) || 0.0
  end

  def full?
    seats_left <= 0
  end
end

class Booking < ApplicationRecord
  belongs_to :trip
  belongs_to :user  # traveler

  enum :status, { pending: 0, confirmed: 1, cancelled: 2 }

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :seats, presence: true, numericality: { greater_than: 0 }
  validates :user_id, uniqueness: { scope: :trip_id }
  validate :traveler_role
  validate :seats_available, on: :create

  private

  def traveler_role
    errors.add(:user, "must be a traveler") unless user&.traveler?
  end

  def seats_available
    return unless trip
    if trip.seats_left < (seats || 1)
      errors.add(:seats, "not enough seats available")
    end
  end
end

class Review < ApplicationRecord
  belongs_to :trip
  belongs_to :user  # reviewer

  validates :rating, presence: true, inclusion: { in: 1..5 }
  validates :text, presence: true
  validates :user_id, uniqueness: { scope: :trip_id }
end

class ItineraryDay < ApplicationRecord
  belongs_to :trip

  validates :day, :title, :desc, presence: true
  default_scope { order(:day) }
end

class Conversation < ApplicationRecord
  belongs_to :trip, optional: true

  has_many :conversation_participants, dependent: :destroy
  has_many :participants, through: :conversation_participants, source: :user
  has_many :messages, -> { order(:created_at) }, dependent: :destroy

  def last_message
    messages.last
  end

  def unread_count_for(user)
    messages.where.not(sender_id: user.id).where(read: false).count
  end
end

class ConversationParticipant < ApplicationRecord
  belongs_to :conversation
  belongs_to :user
end

class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  validates :body, presence: true

  after_create_commit :broadcast_message

  private

  def broadcast_message
    ConversationChannel.broadcast_to(conversation, MessageSerializer.new(self).as_json)
  end
end

class Category < ApplicationRecord
  validates :label, presence: true, uniqueness: true
end

class Collection < ApplicationRecord
  has_one_attached :cover_image
  has_many :collection_trips, dependent: :destroy
  has_many :trips, through: :collection_trips
end

class TripPreference < ApplicationRecord
  belongs_to :user
  belongs_to :followed_agency, class_name: "User", optional: true

  validates :user_id, uniqueness: true
  validate :budget_max_greater_than_min
  validate :followed_agency_must_be_planner

  private

  def budget_max_greater_than_min
    return unless budget_min.present? && budget_max.present?
    errors.add(:budget_max, "must be greater than budget min") if budget_max <= budget_min
  end

  def followed_agency_must_be_planner
    return unless followed_agency.present?
    errors.add(:followed_agency, "must be a planner") unless followed_agency.planner?
  end
end
```

---

## 4. Authentication (JWT)

### 4.1 JWT Service

```ruby
# app/services/jwt_service.rb
class JwtService
  SECRET = Rails.application.credentials.secret_key_base
  EXPIRY = 30.days

  def self.encode(user_id)
    payload = {
      user_id: user_id,
      exp: EXPIRY.from_now.to_i
    }
    JWT.encode(payload, SECRET, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: "HS256")
    decoded.first.symbolize_keys
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
```

### 4.2 Auth Concern

```ruby
# app/controllers/concerns/authenticatable.rb
module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate!
    token = request.headers["Authorization"]&.split(" ")&.last
    payload = JwtService.decode(token)

    if payload
      @current_user = User.find_by(id: payload[:user_id])
    end

    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  # Optional auth — sets current_user if token present, but doesn't block
  def authenticate_optional
    token = request.headers["Authorization"]&.split(" ")&.last
    return unless token
    payload = JwtService.decode(token)
    @current_user = User.find_by(id: payload[:user_id]) if payload
  end

  def current_user
    @current_user
  end
end
```

### 4.3 Role Authorization

```ruby
# app/controllers/concerns/authorizable.rb
module Authorizable
  extend ActiveSupport::Concern

  private

  def require_planner!
    render json: { error: "Forbidden" }, status: :forbidden unless current_user&.planner?
  end

  def require_traveler!
    render json: { error: "Forbidden" }, status: :forbidden unless current_user&.traveler?
  end
end
```

---

## 5. API Endpoints

**Base path**: `/api/v1`

All responses follow the shape:
```json
{ "data": { ... } }              // single resource
{ "data": [ ... ], "meta": {} }  // collection with pagination
{ "error": "message" }           // error
```

---

### 5.1 Auth

| Method | Path              | Description          | Auth |
|--------|-------------------|----------------------|------|
| POST   | /auth/signup      | Register new user    | No   |
| POST   | /auth/login       | Email + password     | No   |
| DELETE | /auth/logout      | Invalidate (no-op*)  | Yes  |
| GET    | /auth/me          | Current user profile | Yes  |

*JWT is stateless — logout is handled client-side by deleting the token. The endpoint exists for future token blacklisting.

#### POST /auth/signup

**Request**:
```json
{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "securepassword",
  "role": "traveler"
}
```

Planner signup (phone required):
```json
{
  "name": "Bilal Ahmad",
  "email": "bilal@example.com",
  "password": "securepassword",
  "role": "planner",
  "phone": "+923001234567"
}
```

**Response** `201`:
```json
{
  "user": {
    "id": "1",
    "name": "Ahmed Khan",
    "email": "ahmed@example.com",
    "role": "traveler",
    "avatar": null,
    "phone": null,
    "createdAt": "2026-04-05T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /auth/login

**Request**:
```json
{
  "email": "ahmed@example.com",
  "password": "securepassword"
}
```

**Response** `200`: Same shape as signup.

**Error** `401`:
```json
{ "error": "Invalid email or password" }
```

#### GET /auth/me

**Headers**: `Authorization: Bearer <token>`

**Response** `200` (Traveler):
```json
{
  "id": "1",
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "role": "traveler",
  "avatar": "https://...",
  "phone": null,
  "createdAt": "2026-04-05T12:00:00Z"
}
```

**Response** `200` (Planner — includes extra fields):
```json
{
  "id": "2",
  "name": "Bilal Ahmad",
  "email": "bilal@example.com",
  "role": "planner",
  "avatar": "https://...",
  "phone": "+923001234567",
  "bio": "Professional tour guide specializing in Northern Pakistan...",
  "guild": "Karakoram Explorers",
  "rating": 4.9,
  "tripsHosted": 34,
  "totalReviews": 89,
  "createdAt": "2026-04-05T12:00:00Z"
}
```

---

### 5.2 User Profile

| Method | Path                 | Description        | Auth |
|--------|----------------------|--------------------|------|
| PATCH  | /users/me            | Update own profile | Yes  |
| PATCH  | /users/me/avatar     | Upload avatar      | Yes  |
| PATCH  | /users/me/cover_photo | Upload cover photo  | Yes  |
| GET    | /users/:id           | Public profile     | Yes  |

#### PATCH /users/me

**Request**:
```json
{
  "name": "New Name",
  "phone": "+923009876543",
  "bio": "Updated bio",
  "guild": "Explorer Guild"
}
```

#### PATCH /users/me/avatar

**Request**: `multipart/form-data` with `avatar` file field.

---

### 5.x Trip Preferences

| Method | Path                 | Description           | Auth |
|--------|----------------------|-----------------------|------|
| GET    | /trip_preferences    | Get my preferences    | Yes  |
| PUT    | /trip_preferences    | Create/update prefs   | Yes  |

---

### 5.3 Trips (Public Browsing — No Auth Required)

> **Key rule**: Browsing trip cards does NOT require login.
> Seeing full trip details (description, itinerary, planner phone, driver info) DOES require login.

| Method | Path                       | Description                        | Auth     |
|--------|----------------------------|------------------------------------|----------|
| GET    | /trips                     | Browse/search active trips         | **No**   |
| GET    | /trips/featured            | Featured trips for home screen     | **No**   |
| GET    | /trips/:id                 | Full trip details                  | **Yes**  |
| GET    | /trips/:id/reviews         | Reviews for a trip                 | **Yes**  |

#### GET /trips (PUBLIC)

**Query params**:
| Param     | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| q         | string | Full-text search (title, location, desc)   |
| tag       | string | Filter by tag (e.g. "Trekking")            |
| min_price | number | Minimum price filter                       |
| max_price | number | Maximum price filter                       |
| location  | string | Filter by location (e.g. "Hunza")          |
| sort      | string | `price_asc`, `price_desc`, `rating`, `newest` |
| page      | int    | Pagination (default: 1)                    |
| per_page  | int    | Items per page (default: 10, max: 50)      |

**Response** `200` — Card-level data only (no phone, no details):
```json
{
  "data": [
    {
      "id": "1",
      "title": "Kashmir Valley Explorer",
      "location": "Neelum Valley, AJK",
      "heroImage": "https://...",
      "price": 45000,
      "currency": "PKR",
      "duration": "5 days",
      "dates": "Oct 12 - 16",
      "seatsLeft": 4,
      "totalSeats": 12,
      "tags": ["Valley", "Cultural"],
      "rating": 4.9,
      "reviewCount": 47,
      "host": {
        "id": "2",
        "name": "Bilal A.",
        "avatar": "https://..."
      }
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 24
  }
}
```

> **Note**: Trip list does NOT expose `host.phone`, `host.guild`, `host.rating`, driver info, description, itinerary, or highlights. Only card-preview data.

#### GET /trips/:id (AUTH REQUIRED)

**Response** `200` — Full trip detail with planner contact + driver info:
```json
{
  "id": "1",
  "title": "Kashmir Valley Explorer",
  "subtitle": "A Journey Through Paradise on Earth",
  "description": "Embark on a 5-day guided expedition through the stunning Neelum Valley...",
  "location": "Neelum Valley, AJK",
  "heroImage": "https://...",
  "gallery": ["https://...", "https://..."],
  "price": 45000,
  "currency": "PKR",
  "duration": "5 days",
  "dates": "Oct 12 - 16, 2026",
  "totalSeats": 12,
  "seatsLeft": 4,
  "status": "active",
  "tags": ["Valley", "Cultural"],
  "rating": 4.9,
  "reviewCount": 47,
  "host": {
    "id": "2",
    "name": "Bilal Ahmad",
    "avatar": "https://...",
    "phone": "+923001234567",
    "guild": "Karakoram Explorers",
    "rating": 4.9
  },
  "driver": {
    "name": "Farooq Khan",
    "phone": "+923451234567",
    "vehicle": "Toyota Coaster - White (LHR-4521)"
  },
  "highlights": [
    "Visit Sharda Temple ruins",
    "Rafting in Neelum River",
    "Camping at Ratti Gali Lake",
    "Local Kashmiri cuisine experience",
    "Sunrise at Chitta Katha Lake"
  ],
  "itinerary": [
    { "day": "1", "title": "Arrival in Muzaffarabad", "desc": "Welcome dinner & briefing at hotel" },
    { "day": "2", "title": "Neelum Valley Drive", "desc": "Scenic drive through Keran, Sharda" }
  ],
  "createdAt": "2026-03-01T00:00:00Z"
}
```

> **401 if not logged in** — This forces travelers to sign up to see planner's phone number, trip details, and driver info.

#### GET /trips/:id (UNAUTHENTICATED → 401)

```json
{ "error": "Login required to view trip details" }
```

---

### 5.4 Trips (Planner — Management)

| Method | Path                            | Description                | Auth    |
|--------|---------------------------------|----------------------------|---------|
| GET    | /planner/trips                  | My trips (all statuses)    | Planner |
| POST   | /planner/trips                  | Create new trip            | Planner |
| PATCH  | /planner/trips/:id              | Update trip                | Planner |
| DELETE | /planner/trips/:id              | Delete trip (draft only)   | Planner |
| PATCH  | /planner/trips/:id/publish      | Move draft → active        | Planner |
| PATCH  | /planner/trips/:id/complete     | Move active → completed    | Planner |
| POST   | /planner/trips/:id/hero_image   | Upload hero image          | Planner |
| POST   | /planner/trips/:id/gallery      | Upload gallery images      | Planner |
| GET    | /planner/trips/:id/passengers   | Confirmed traveler list    | Planner |

#### POST /planner/trips

**Request**:
```json
{
  "title": "Kumrat Valley Adventure",
  "subtitle": "Hidden gem of KPK",
  "description": "A 4-day adventure through Kumrat Valley, one of Pakistan's most untouched destinations...",
  "location": "Kumrat Valley, Dir Upper, KPK",
  "price": 35000,
  "currency": "PKR",
  "duration": "4 days",
  "start_date": "2026-06-15",
  "end_date": "2026-06-18",
  "total_seats": 15,
  "tags": ["Valley", "Camping"],
  "highlights": ["Jahaz Banda meadows", "Do Kala Chashma waterfall", "Trout fishing"],
  "driver_name": "Shahid Gul",
  "driver_phone": "+923451234567",
  "driver_vehicle": "Toyota Coaster - White (DIR-1234)",
  "itinerary_days": [
    { "day": 1, "title": "Departure from Islamabad", "desc": "Early morning departure, lunch at Chakdara" },
    { "day": 2, "title": "Kumrat Valley", "desc": "Explore Jahaz Banda and camping setup" },
    { "day": 3, "title": "Do Kala Chashma", "desc": "Trek to the twin waterfalls" },
    { "day": 4, "title": "Return", "desc": "Drive back to Islamabad" }
  ]
}
```

**Response** `201`: Full trip object.

#### GET /planner/trips/:id/passengers

Returns list of travelers who have confirmed bookings for this trip.
Planner uses this to manage who is joining and track seat fill.

**Response** `200`:
```json
{
  "data": [
    {
      "id": "1",
      "bookingId": "5",
      "name": "Ahmed Khan",
      "email": "ahmed@example.com",
      "phone": "+923331234567",
      "avatar": "https://...",
      "seats": 2,
      "amount": 90000,
      "status": "confirmed",
      "bookedAt": "2026-04-01T10:00:00Z"
    },
    {
      "id": "3",
      "bookingId": "7",
      "name": "Fatima Ali",
      "email": "fatima@example.com",
      "phone": null,
      "avatar": "https://...",
      "seats": 1,
      "amount": 45000,
      "status": "confirmed",
      "bookedAt": "2026-04-02T14:30:00Z"
    }
  ],
  "meta": {
    "totalSeats": 12,
    "seatsBooked": 3,
    "seatsLeft": 9,
    "totalRevenue": 135000
  }
}
```

**Implementation**:
```ruby
# app/controllers/api/v1/planner/trips_controller.rb
def passengers
  trip = current_user.trips.find(params[:id])
  bookings = trip.bookings.where(status: [:pending, :confirmed])
                .includes(:user)
                .order(created_at: :desc)

  render json: {
    data: bookings.map { |b| PassengerSerializer.new(b).as_json },
    meta: {
      totalSeats: trip.total_seats,
      seatsBooked: trip.bookings.confirmed.sum(:seats),
      seatsLeft: trip.seats_left,
      totalRevenue: trip.bookings.confirmed.sum(:amount)
    }
  }
end
```

---

### 5.5 Bookings

| Method | Path                                | Description                     | Auth     |
|--------|-------------------------------------|---------------------------------|----------|
| POST   | /trips/:trip_id/bookings            | Request to join a trip          | Traveler |
| GET    | /bookings                           | My bookings (traveler)          | Traveler |
| GET    | /bookings/:id                       | Booking detail                  | Yes      |
| PATCH  | /bookings/:id/cancel                | Cancel booking                  | Traveler |
| GET    | /planner/bookings                   | All bookings for my trips       | Planner  |
| PATCH  | /planner/bookings/:id/confirm       | Confirm a booking request       | Planner  |
| PATCH  | /planner/bookings/:id/cancel        | Reject a booking request        | Planner  |

#### Booking Flow

```
Traveler taps "Request to Join" on trip
        ↓
POST /trips/:id/bookings (status: pending)
        ↓
Planner sees in BookingRequestsScreen
        ↓
Planner taps "Confirm" → PATCH /planner/bookings/:id/confirm
        ↓
status → confirmed, seats_left decreases, traveler appears in passengers list
```

#### POST /trips/:trip_id/bookings

**Request**:
```json
{
  "seats": 2,
  "note": "Joining with my brother. Any dietary options?"
}
```

**Auto-calculated**: `amount = trip.price * seats`

**Validations**:
- Must be logged in as traveler
- Can't book same trip twice
- Trip must have enough `seats_left`
- Trip must be `active`

**Response** `201`:
```json
{
  "id": "1",
  "tripId": "1",
  "travelerId": "5",
  "travelerName": "Ahmed Khan",
  "travelerAvatar": "https://...",
  "status": "pending",
  "seats": 2,
  "amount": 90000,
  "note": "Joining with my brother. Any dietary options?",
  "createdAt": "2026-04-05T14:00:00Z"
}
```

#### PATCH /planner/bookings/:id/confirm

**What happens**:
1. Booking status → `confirmed`
2. `trip.seats_left` recalculated (auto via computed field)
3. Traveler appears in `GET /planner/trips/:id/passengers`

**Response** `200`:
```json
{
  "id": "1",
  "status": "confirmed",
  "seats": 2,
  "amount": 90000,
  "tripTitle": "Kashmir Valley Explorer",
  "travelerName": "Ahmed Khan"
}
```

#### GET /planner/bookings

**Query params**: `status` (pending/confirmed/cancelled), `trip_id`, `page`, `per_page`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "1",
      "tripId": "1",
      "travelerId": "5",
      "travelerName": "Ahmed Khan",
      "travelerAvatar": "https://...",
      "travelerPhone": "+923331234567",
      "tripTitle": "Kashmir Valley Explorer",
      "status": "pending",
      "seats": 2,
      "amount": 90000,
      "note": "Joining with my brother",
      "createdAt": "2026-04-05T12:00:00Z"
    }
  ]
}
```

---

### 5.6 Planner Dashboard Stats

| Method | Path              | Description                      | Auth    |
|--------|-------------------|----------------------------------|---------|
| GET    | /planner/stats    | Aggregated dashboard metrics     | Planner |

#### GET /planner/stats

**Response** `200`:
```json
{
  "totalRevenue": 1245000,
  "activeTrips": 8,
  "totalBookings": 47,
  "totalTravelers": 38,
  "avgRating": 4.9,
  "monthlyGrowth": 23
}
```

**Implementation**:
```ruby
def stats
  trips = current_user.trips
  confirmed_bookings = Booking.confirmed.where(trip: trips)

  this_month = confirmed_bookings.where(created_at: Time.current.beginning_of_month..)
  last_month = confirmed_bookings.where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month)
  growth = last_month.sum(:amount).positive? ?
    ((this_month.sum(:amount) - last_month.sum(:amount)) / last_month.sum(:amount) * 100).round : 0

  render json: {
    totalRevenue: confirmed_bookings.sum(:amount),
    activeTrips: trips.active.count,
    totalBookings: confirmed_bookings.count,
    totalTravelers: confirmed_bookings.distinct.count(:user_id),
    avgRating: trips.joins(:reviews).average("reviews.rating")&.round(1) || 0.0,
    monthlyGrowth: growth
  }
end
```

---

### 5.7 Reviews

| Method | Path                          | Description            | Auth     |
|--------|-------------------------------|------------------------|----------|
| GET    | /trips/:trip_id/reviews       | List reviews for trip  | Yes      |
| POST   | /trips/:trip_id/reviews       | Write a review         | Traveler |

#### POST /trips/:trip_id/reviews

**Validation**: Traveler must have a `confirmed` booking on this trip.

**Request**:
```json
{
  "rating": 5,
  "text": "Absolutely amazing experience! The Kashmir valley was breathtaking..."
}
```

**Response** `201`:
```json
{
  "id": "1",
  "tripId": "1",
  "userId": "5",
  "name": "Ahmed K.",
  "avatar": "https://...",
  "rating": 5,
  "text": "Absolutely amazing experience!...",
  "date": "Apr 2026"
}
```

---

### 5.8 Conversations & Messages

| Method | Path                                       | Description               | Auth |
|--------|--------------------------------------------|---------------------------|------|
| GET    | /conversations                             | My conversations          | Yes  |
| POST   | /conversations                             | Start new conversation    | Yes  |
| GET    | /conversations/:id/messages                | Message history           | Yes  |
| POST   | /conversations/:id/messages                | Send a message            | Yes  |
| PATCH  | /conversations/:id/messages/read           | Mark messages as read     | Yes  |

#### GET /conversations

**Response** `200`:
```json
{
  "data": [
    {
      "id": "1",
      "participantId": "3",
      "participantName": "Bilal Ahmad",
      "participantAvatar": "https://...",
      "lastMessage": "Ji bilkul, packing list share kar deta hoon",
      "time": "2m ago",
      "unread": 2,
      "online": true,
      "tripContext": "Kashmir Valley Explorer"
    }
  ]
}
```

#### POST /conversations

Typically: traveler opens trip detail → taps planner phone/contact → can also message via chat.

**Request**:
```json
{
  "participant_id": "3",
  "trip_id": "2",
  "message": "Assalam o Alaikum! I had a question about the Swat trip..."
}
```

#### GET /conversations/:id/messages

**Query params**: `page`, `per_page` (newest first for infinite scroll)

**Response** `200`:
```json
{
  "data": [
    {
      "id": "1",
      "conversationId": "1",
      "senderId": "3",
      "text": "Wa Alaikum Assalam! Sure, what would you like to know?",
      "createdAt": "2026-04-05T14:00:00Z",
      "read": true
    }
  ],
  "meta": { "currentPage": 1, "totalPages": 5, "totalCount": 48 }
}
```

---

### 5.9 Categories & Collections

| Method | Path                          | Description               | Auth |
|--------|-------------------------------|---------------------------|------|
| GET    | /categories                   | List all categories       | No   |
| GET    | /collections                  | Curated collections       | No   |
| GET    | /collections/:id              | Collection with trips     | No   |

#### GET /categories

**Response** `200`:
```json
{
  "data": [
    { "id": "1", "label": "All", "icon": "compass" },
    { "id": "2", "label": "Northern Areas", "icon": "mountain-snow" },
    { "id": "3", "label": "Trekking", "icon": "footsteps" },
    { "id": "4", "label": "Family", "icon": "people" },
    { "id": "5", "label": "Cultural", "icon": "landmark" },
    { "id": "6", "label": "Camping", "icon": "bonfire" }
  ]
}
```

#### GET /collections

**Response** `200`:
```json
{
  "data": [
    {
      "id": "1",
      "title": "Northern Wonders",
      "subtitle": "12 curated trips",
      "image": "https://..."
    },
    {
      "id": "2",
      "title": "Kashmir & Beyond",
      "subtitle": "8 curated trips",
      "image": "https://..."
    },
    {
      "id": "3",
      "title": "Weekend Getaways",
      "subtitle": "15 trips near Islamabad",
      "image": "https://..."
    }
  ]
}
```

---

## 6. Action Cable (Real-time Chat)

### Channel Setup

```ruby
# app/channels/conversation_channel.rb
class ConversationChannel < ApplicationCable::Channel
  def subscribed
    conversation = Conversation.find(params[:id])
    if conversation.participants.include?(current_user)
      stream_for conversation
    else
      reject
    end
  end
end
```

### Connection Auth

```ruby
# app/channels/application_cable/connection.rb
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token]
      payload = JwtService.decode(token)
      User.find_by(id: payload&.dig(:user_id)) || reject_unauthorized_connection
    end
  end
end
```

### Mobile Client Connection

```
ws://localhost:3000/cable?token=<jwt_token>
```

### Message Broadcast Shape

```json
{
  "id": "42",
  "conversationId": "1",
  "senderId": "3",
  "text": "Islamabad se kitne baje nikalna hai?",
  "createdAt": "2026-04-05T14:30:00Z",
  "read": false
}
```

---

## 7. Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      post   "auth/signup",  to: "auth#signup"
      post   "auth/login",   to: "auth#login"
      delete "auth/logout",  to: "auth#logout"
      get    "auth/me",      to: "auth#me"

      # User profile
      patch "users/me",        to: "users#update"
      patch "users/me/avatar", to: "users#update_avatar"
      patch "users/me/cover_photo", to: "users#update_cover_photo"
      get   "users/:id",      to: "users#show"

      # Trips (public browsing — no auth for index/featured)
      resources :trips, only: [:index, :show] do
        resources :reviews, only: [:index, :create]
        resources :bookings, only: [:create]
      end
      get "trips/featured", to: "trips#featured", as: :featured_trips

      # Traveler bookings
      resources :bookings, only: [:index, :show] do
        patch :cancel, on: :member
      end

      # Conversations & Messages
      resources :conversations, only: [:index, :create] do
        resources :messages, only: [:index, :create]
        patch "messages/read", to: "messages#mark_read"
      end

      # Categories & Collections (public — no auth)
      resources :categories, only: [:index]
      resources :collections, only: [:index, :show]

      # Trip Preferences (traveler)
      get "trip_preferences", to: "trip_preferences#show"
      put "trip_preferences", to: "trip_preferences#upsert"

      # Planner namespace
      namespace :planner do
        get "stats", to: "stats#index"

        resources :trips, only: [:index, :create, :update, :destroy] do
          patch :publish, on: :member
          patch :complete, on: :member
          post  :hero_image, on: :member
          post  :gallery, on: :member
          get   :passengers, on: :member
        end

        resources :bookings, only: [:index] do
          patch :confirm, on: :member
          patch :cancel, on: :member
        end
      end
    end
  end

  # Action Cable
  mount ActionCable.server => "/cable"
end
```

---

## 8. Controllers

### Directory Structure

```
app/controllers/
  api/
    v1/
      auth_controller.rb
      users_controller.rb
      trips_controller.rb
      bookings_controller.rb
      reviews_controller.rb
      conversations_controller.rb
      messages_controller.rb
      categories_controller.rb
      collections_controller.rb
      trip_preferences_controller.rb
      planner/
        stats_controller.rb
        trips_controller.rb
        bookings_controller.rb
```

### Base Controller

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ActionController::API
      include Authenticatable
      include Authorizable

      before_action :authenticate!

      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "Not found" }, status: :not_found
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end
  end
end
```

### Auth Controller

```ruby
module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate!, only: [:signup, :login]

      def signup
        user = User.new(signup_params)
        if user.save
          token = JwtService.encode(user.id)
          render json: { user: UserSerializer.new(user), token: token }, status: :created
        else
          render json: { error: user.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: params[:email]&.downcase)
        if user&.authenticate(params[:password])
          token = JwtService.encode(user.id)
          render json: { user: UserSerializer.new(user), token: token }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def logout
        head :no_content
      end

      def me
        render json: UserSerializer.new(current_user)
      end

      private

      def signup_params
        params.permit(:name, :email, :password, :role, :phone)
      end
    end
  end
end
```

### Trips Controller (Public browse, Authed details)

```ruby
module Api
  module V1
    class TripsController < BaseController
      # Browse trips without login
      skip_before_action :authenticate!, only: [:index, :featured]

      # Trip details require login
      # (authenticate! runs for :show)

      def index
        trips = Trip.active
        trips = trips.where("title ILIKE :q OR location ILIKE :q OR description ILIKE :q", q: "%#{params[:q]}%") if params[:q].present?
        trips = trips.by_category(params[:tag]) if params[:tag].present?
        trips = trips.where("price >= ?", params[:min_price]) if params[:min_price].present?
        trips = trips.where("price <= ?", params[:max_price]) if params[:max_price].present?
        trips = trips.where("location ILIKE ?", "%#{params[:location]}%") if params[:location].present?

        trips = case params[:sort]
                when "price_asc"  then trips.order(price: :asc)
                when "price_desc" then trips.order(price: :desc)
                when "rating"     then trips.left_joins(:reviews).group(:id).order("AVG(reviews.rating) DESC NULLS LAST")
                else trips.order(created_at: :desc)
                end

        render json: paginate(trips, TripListSerializer)
      end

      def featured
        trips = Trip.featured
        render json: { data: trips.map { |t| TripListSerializer.new(t).as_json } }
      end

      def show
        trip = Trip.find(params[:id])
        render json: TripDetailSerializer.new(trip)
      end
    end
  end
end
```

### Planner Bookings Controller

```ruby
module Api
  module V1
    module Planner
      class BookingsController < BaseController
        before_action :require_planner!

        def index
          bookings = Booking.where(trip: current_user.trips)
                           .includes(:user, :trip)
          bookings = bookings.where(status: params[:status]) if params[:status].present?
          bookings = bookings.where(trip_id: params[:trip_id]) if params[:trip_id].present?
          bookings = bookings.order(created_at: :desc)

          render json: paginate(bookings, BookingSerializer, planner_view: true)
        end

        def confirm
          booking = Booking.where(trip: current_user.trips).find(params[:id])

          if booking.trip.seats_left < booking.seats
            render json: { error: "Not enough seats left" }, status: :unprocessable_entity
            return
          end

          booking.confirmed!
          render json: BookingSerializer.new(booking, planner_view: true)
        end

        def cancel
          booking = Booking.where(trip: current_user.trips).find(params[:id])
          booking.cancelled!
          render json: BookingSerializer.new(booking, planner_view: true)
        end
      end
    end
  end
end
```

---

## 9. Serializers

JSON keys use **camelCase** to match the frontend TypeScript interfaces directly.

```ruby
# config/initializers/active_model_serializers.rb
ActiveModelSerializers.config.key_transform = :camel_lower
```

```ruby
# app/serializers/user_serializer.rb
class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :role, :avatar, :phone, :notifications_enabled, :created_at
  attributes :bio, :guild, :rating, :trips_hosted, :total_reviews,
             :youtube_url, :instagram_url, :tiktok_url, :twitter_url, :website_url, :cover_photo

  def id;         object.id.to_s end
  def avatar;     object.avatar.attached? ? url_for(object.avatar) : nil end
  def created_at; object.created_at.iso8601 end

  def rating
    return nil unless object.planner?
    object.trips.joins(:reviews).average("reviews.rating")&.round(1) || 0.0
  end

  def trips_hosted
    return nil unless object.planner?
    object.trips.count
  end

  def total_reviews
    return nil unless object.planner?
    Review.where(trip: object.trips).count
  end

  def cover_photo
    object.cover_photo.attached? ? url_for(object.cover_photo) : nil
  end

  def attributes(*args)
    hash = super
    unless object.planner?
      hash.delete(:bio)
      hash.delete(:guild)
      hash.delete(:rating)
      hash.delete(:trips_hosted)
      hash.delete(:total_reviews)
      hash.delete(:youtube_url)
      hash.delete(:instagram_url)
      hash.delete(:tiktok_url)
      hash.delete(:twitter_url)
      hash.delete(:website_url)
      hash.delete(:cover_photo)
    end
    hash
  end
end
```

```ruby
# app/serializers/trip_list_serializer.rb  (for index/featured — NO phone, NO details)
class TripListSerializer < ActiveModel::Serializer
  attributes :id, :title, :location, :hero_image, :price, :currency,
             :duration, :dates, :seats_left, :total_seats, :tags, :rating, :review_count

  attribute :host

  def id;          object.id.to_s end
  def hero_image;  url_for(object.hero_image) if object.hero_image.attached? end
  def dates;       "#{object.start_date.strftime('%b %-d')} - #{object.end_date.strftime('%-d')}" end
  def seats_left;  object.seats_left end
  def rating;      object.average_rating end
  def review_count; object.reviews.count end

  # Minimal host info — NO phone
  def host
    h = object.host
    {
      id: h.id.to_s,
      name: h.name,
      avatar: h.avatar.attached? ? url_for(h.avatar) : nil
    }
  end
end
```

```ruby
# app/serializers/trip_detail_serializer.rb  (for show — includes phone + driver)
class TripDetailSerializer < TripListSerializer
  attributes :subtitle, :description, :gallery, :status,
             :highlights, :itinerary, :driver, :created_at

  # Override host to include phone + guild + rating
  def host
    h = object.host
    {
      id: h.id.to_s,
      name: h.name,
      avatar: h.avatar.attached? ? url_for(h.avatar) : nil,
      phone: h.phone,
      guild: h.guild,
      rating: h.trips.joins(:reviews).average("reviews.rating")&.round(1) || 0.0
    }
  end

  def gallery
    object.gallery.map { |img| url_for(img) }
  end

  def itinerary
    object.itinerary_days.map { |d| { day: d.day.to_s, title: d.title, desc: d.desc } }
  end

  def driver
    return nil unless object.driver_name.present?
    {
      name: object.driver_name,
      phone: object.driver_phone,
      vehicle: object.driver_vehicle
    }
  end

  def created_at
    object.created_at.iso8601
  end
end
```

```ruby
# app/serializers/booking_serializer.rb
class BookingSerializer < ActiveModel::Serializer
  attributes :id, :trip_id, :traveler_id, :traveler_name, :traveler_avatar,
             :status, :seats, :amount, :note, :created_at

  attribute :trip_title,     if: -> { instance_options[:planner_view] }
  attribute :traveler_phone, if: -> { instance_options[:planner_view] }

  def id;              object.id.to_s end
  def trip_id;         object.trip_id.to_s end
  def traveler_id;     object.user_id.to_s end
  def traveler_name;   object.user.name end
  def traveler_avatar; object.user.avatar.attached? ? url_for(object.user.avatar) : nil end
  def traveler_phone;  object.user.phone end
  def created_at;      object.created_at.iso8601 end
  def trip_title;      object.trip.title end
end
```

```ruby
# app/serializers/passenger_serializer.rb
class PassengerSerializer < ActiveModel::Serializer
  attributes :id, :booking_id, :name, :email, :phone, :avatar,
             :seats, :amount, :status, :booked_at

  def id;         object.user.id.to_s end
  def booking_id; object.id.to_s end
  def name;       object.user.name end
  def email;      object.user.email end
  def phone;      object.user.phone end
  def avatar;     object.user.avatar.attached? ? url_for(object.user.avatar) : nil end
  def booked_at;  object.created_at.iso8601 end
end
```

```ruby
# app/serializers/conversation_serializer.rb
class ConversationSerializer < ActiveModel::Serializer
  attributes :id, :participant_id, :participant_name, :participant_avatar,
             :last_message, :time, :unread, :online, :trip_context

  def id;                object.id.to_s end
  def participant_id;    other_user.id.to_s end
  def participant_name;  other_user.name end
  def participant_avatar
    other_user.avatar.attached? ? url_for(other_user.avatar) : nil
  end
  def last_message;      object.last_message&.body end
  def time;              time_ago_in_words(object.last_message&.created_at) end
  def unread;            object.unread_count_for(current_user) end
  def online;            other_user.online end
  def trip_context;      object.trip&.title end

  private

  def other_user
    @other_user ||= object.participants.where.not(id: current_user.id).first
  end

  def current_user
    instance_options[:current_user]
  end
end
```

```ruby
# app/serializers/message_serializer.rb
class MessageSerializer < ActiveModel::Serializer
  attributes :id, :conversation_id, :sender_id, :text, :created_at, :read

  def id;              object.id.to_s end
  def conversation_id; object.conversation_id.to_s end
  def sender_id;       object.sender_id.to_s end
  def text;            object.body end
  def created_at;      object.created_at.iso8601 end
end
```

```ruby
# app/serializers/review_serializer.rb
class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :trip_id, :user_id, :name, :avatar, :rating, :text, :date

  def id;       object.id.to_s end
  def trip_id;  object.trip_id.to_s end
  def user_id;  object.user_id.to_s end
  def name;     object.user.name end
  def avatar;   object.user.avatar.attached? ? url_for(object.user.avatar) : nil end
  def date;     object.created_at.strftime("%b %Y") end
end
```

```ruby
# app/serializers/trip_preference_serializer.rb
class TripPreferenceSerializer < ActiveModel::Serializer
  attributes :id, :budget_min, :budget_max, :preferred_months,
             :followed_agency_id, :followed_agency_name

  def id
    object.id.to_s
  end

  def followed_agency_name
    object.followed_agency&.agency_name || object.followed_agency&.name
  end
end
```

---

## 9.5 Background Jobs & Services

### ExpoPushService
Replaces FcmPushService. Sends push notifications via Expo's Push API (`https://exp.host/--/api/v2/push/send`). No credentials needed — works with Expo push tokens generated by the mobile app.

### NotifyNewTripJob
Enqueued when a trip is published (`planner/trips#publish`). Queries `TripPreference` records matching the trip by budget range, month, or followed agency. Sends "Matches your preferences!" notification to matching travelers, and "New Trip Available!" to remaining travelers with `notifications_enabled: true`.

### TripReminderJob
Runs daily at 8am (via `config/recurring.yml`). Finds active trips starting in 7, 3, or 1 days. Sends trip reminder notification to travelers with confirmed bookings. Includes deduplication to avoid duplicate reminders.

### Recurring Jobs Configuration
```yaml
# config/recurring.yml
production:
  trip_reminders:
    class: TripReminderJob
    schedule: every day at 8am

development:
  trip_reminders:
    class: TripReminderJob
    schedule: every day at 8am
```

---

## 10. Seeds (Pakistan Data)

```ruby
# db/seeds.rb

puts "Seeding Nazary..."

# Categories (Pakistan-relevant)
[
  ["All",             "compass"],
  ["Northern Areas",  "mountain-snow"],
  ["Trekking",        "footsteps"],
  ["Family",          "people"],
  ["Cultural",        "landmark"],
  ["Camping",         "bonfire"],
].each do |label, icon|
  Category.find_or_create_by!(label: label, icon: icon)
end

# ── Planner ──────────────────────────────────────────────────
planner = User.find_or_create_by!(email: "bilal@nazary.pk") do |u|
  u.name     = "Bilal Ahmad"
  u.password = "password123"
  u.role     = :planner
  u.phone    = "+923001234567"
  u.bio      = "Professional tour guide specializing in Northern Pakistan. 8 years of experience across Gilgit-Baltistan, KPK, and AJK."
  u.guild    = "Karakoram Explorers"
end

planner2 = User.find_or_create_by!(email: "ayesha@nazary.pk") do |u|
  u.name     = "Ayesha Malik"
  u.password = "password123"
  u.role     = :planner
  u.phone    = "+923009876543"
  u.bio      = "Adventure enthusiast organizing family-friendly trips to Swat, Kalam, and Kumrat."
  u.guild    = "Swat Valley Tours"
end

# ── Travelers ────────────────────────────────────────────────
traveler = User.find_or_create_by!(email: "ahmed@example.com") do |u|
  u.name     = "Ahmed Khan"
  u.password = "password123"
  u.role     = :traveler
end

traveler2 = User.find_or_create_by!(email: "fatima@example.com") do |u|
  u.name     = "Fatima Ali"
  u.password = "password123"
  u.role     = :traveler
  u.phone    = "+923331234567"
end

# ── Trip 1: Kashmir ──────────────────────────────────────────
trip1 = Trip.find_or_create_by!(title: "Kashmir Valley Explorer") do |t|
  t.host           = planner
  t.subtitle       = "A Journey Through Paradise on Earth"
  t.description    = "Embark on a 5-day guided trip through the stunning Neelum Valley in Azad Kashmir. Visit Sharda, Kel, Arang Kel, and camp beside the pristine Ratti Gali Lake."
  t.location       = "Neelum Valley, AJK"
  t.price          = 45000
  t.currency       = "PKR"
  t.duration       = "5 days"
  t.start_date     = "2026-10-12"
  t.end_date       = "2026-10-16"
  t.total_seats    = 12
  t.status         = :active
  t.tags           = ["Northern Areas", "Trekking"]
  t.highlights     = [
    "Visit Sharda Temple ruins",
    "Trek to Ratti Gali Lake",
    "Camping at Arang Kel",
    "Local Kashmiri cuisine",
    "Sunrise views over Neelum Valley"
  ]
  t.driver_name    = "Farooq Khan"
  t.driver_phone   = "+923451234567"
  t.driver_vehicle = "Toyota Coaster - White (MZD-4521)"
end

[
  [1, "Arrival in Muzaffarabad",  "Pick up from Islamabad, drive to Muzaffarabad. Welcome dinner."],
  [2, "Neelum Valley Drive",      "Scenic drive along Neelum River to Keran & Sharda."],
  [3, "Arang Kel Trek",           "Cross the river by chairlift, trek to Arang Kel village."],
  [4, "Ratti Gali Lake",          "Full-day trek to Ratti Gali Lake. Camp by the lake."],
  [5, "Return to Islamabad",      "Drive back with stops for photos. Drop at Islamabad."],
].each do |day, title, desc|
  trip1.itinerary_days.find_or_create_by!(day: day, title: title, desc: desc)
end

# ── Trip 2: Swat & Kalam ────────────────────────────────────
trip2 = Trip.find_or_create_by!(title: "Swat & Kalam Escape") do |t|
  t.host           = planner2
  t.subtitle       = "The Switzerland of Pakistan"
  t.description    = "A 4-day family-friendly trip to the lush green valleys of Swat and Kalam. Visit Malam Jabba, Fizagat Park, Ushu Forest, and Mahodand Lake."
  t.location       = "Swat & Kalam, KPK"
  t.price          = 35000
  t.currency       = "PKR"
  t.duration       = "4 days"
  t.start_date     = "2026-11-03"
  t.end_date       = "2026-11-06"
  t.total_seats    = 15
  t.status         = :active
  t.tags           = ["Family", "Northern Areas"]
  t.highlights     = [
    "Skiing slopes at Malam Jabba",
    "Boating at Mahodand Lake",
    "Ushu Forest walk",
    "Local trout fish BBQ",
    "Visit Swat Museum"
  ]
  t.driver_name    = "Gul Zaman"
  t.driver_phone   = "+923461234567"
  t.driver_vehicle = "Hiace Grand Cabin - Silver (SWT-1122)"
end

[
  [1, "Islamabad to Swat",    "Early departure, lunch at Chakdara, visit Swat Museum."],
  [2, "Malam Jabba & Mingora", "Day at Malam Jabba ski resort, explore Mingora bazaar."],
  [3, "Kalam & Ushu Forest",  "Drive to Kalam, visit Ushu Forest, camp by the river."],
  [4, "Mahodand Lake & Return","Morning at Mahodand Lake, drive back to Islamabad."],
].each do |day, title, desc|
  trip2.itinerary_days.find_or_create_by!(day: day, title: title, desc: desc)
end

# ── Trip 3: Kumrat Valley ───────────────────────────────────
trip3 = Trip.find_or_create_by!(title: "Kumrat Valley Adventure") do |t|
  t.host           = planner
  t.subtitle       = "The Hidden Gem of Dir"
  t.description    = "Explore one of Pakistan's most pristine and untouched valleys. Trek through Jahaz Banda meadows, camp under the stars, and visit the stunning Do Kala Chashma waterfall."
  t.location       = "Kumrat Valley, Dir Upper, KPK"
  t.price          = 32000
  t.currency       = "PKR"
  t.duration       = "3 days"
  t.start_date     = "2026-12-01"
  t.end_date       = "2026-12-03"
  t.total_seats    = 10
  t.status         = :active
  t.tags           = ["Camping", "Trekking"]
  t.highlights     = [
    "Jahaz Banda meadows trek",
    "Do Kala Chashma waterfall",
    "Camping under starry skies",
    "Trout fishing in Panjkora River",
    "Off-road jeep adventure"
  ]
  t.driver_name    = "Shahid Gul"
  t.driver_phone   = "+923471234567"
  t.driver_vehicle = "Land Cruiser - Green (DIR-7890)"
end

# ── Trip 4: Hunza (Draft) ───────────────────────────────────
Trip.find_or_create_by!(title: "Hunza & Fairy Meadows") do |t|
  t.host           = planner
  t.subtitle       = "Where the mountains touch the sky"
  t.description    = "A 7-day expedition through the Karakoram Highway to Hunza, Passu, Attabad Lake, and Fairy Meadows with a view of Nanga Parbat."
  t.location       = "Hunza Valley & Fairy Meadows, GB"
  t.price          = 75000
  t.currency       = "PKR"
  t.duration       = "7 days"
  t.start_date     = "2026-07-15"
  t.end_date       = "2026-07-21"
  t.total_seats    = 10
  t.status         = :draft
  t.tags           = ["Northern Areas", "Trekking", "Cultural"]
  t.highlights     = [
    "Karakoram Highway scenic drive",
    "Attabad Lake boating",
    "Passu Glacier & Suspension Bridge",
    "Fairy Meadows camp with Nanga Parbat view",
    "Eagle's Nest viewpoint at sunset"
  ]
end

# ── Bookings ─────────────────────────────────────────────────
Booking.find_or_create_by!(trip: trip1, user: traveler) do |b|
  b.amount  = 90000
  b.seats   = 2
  b.status  = :confirmed
  b.note    = "Joining with my friend."
end

Booking.find_or_create_by!(trip: trip1, user: traveler2) do |b|
  b.amount  = 45000
  b.seats   = 1
  b.status  = :confirmed
end

Booking.find_or_create_by!(trip: trip2, user: traveler) do |b|
  b.amount  = 70000
  b.seats   = 2
  b.status  = :pending
  b.note    = "Family trip with my wife. Any kids discount?"
end

# ── Reviews ──────────────────────────────────────────────────
Review.find_or_create_by!(trip: trip1, user: traveler) do |r|
  r.rating = 5
  r.text   = "Best trip I've ever been on! Bilal bhai is an amazing guide. Ratti Gali Lake was breathtaking."
end

Review.find_or_create_by!(trip: trip1, user: traveler2) do |r|
  r.rating = 5
  r.text   = "The Neelum Valley views were unreal. Everything was well organized. Highly recommend!"
end

# ── Conversations ────────────────────────────────────────────
convo = Conversation.find_or_create_by!(trip: trip1)
[planner, traveler].each do |user|
  ConversationParticipant.find_or_create_by!(conversation: convo, user: user)
end
Message.find_or_create_by!(conversation: convo, sender: traveler, body: "Assalam o Alaikum Bilal bhai! Kya Ratti Gali trek mushkil hai?")
Message.find_or_create_by!(conversation: convo, sender: planner, body: "Wa Alaikum Assalam! Moderate hai, 3-4 hours ka trek. Comfortable shoes lana zaroor.")

convo2 = Conversation.find_or_create_by!(trip: trip2)
[planner2, traveler].each do |user|
  ConversationParticipant.find_or_create_by!(conversation: convo2, user: user)
end
Message.find_or_create_by!(conversation: convo2, sender: traveler, body: "Ayesha ji, kya Swat trip mein bacchon ke liye koi discount hai?")
Message.find_or_create_by!(conversation: convo2, sender: planner2, body: "Ji, 5 saal se kam ke bacchon ka half price hai!")

# ── Collections ──────────────────────────────────────────────
c1 = Collection.find_or_create_by!(title: "Northern Wonders") do |c|
  c.subtitle = "12 curated trips"
end
c1.trips << trip1 unless c1.trips.include?(trip1)

c2 = Collection.find_or_create_by!(title: "Kashmir & Beyond") do |c|
  c.subtitle = "8 curated trips"
end
c2.trips << trip1 unless c2.trips.include?(trip1)

c3 = Collection.find_or_create_by!(title: "Weekend Getaways") do |c|
  c.subtitle = "15 trips near Islamabad"
end
c3.trips << trip3 unless c3.trips.include?(trip3)

puts "Seeded #{User.count} users, #{Trip.count} trips, #{Booking.count} bookings!"
```

---

## 11. Testing Strategy

```
spec/
  models/
    user_spec.rb
    trip_spec.rb
    booking_spec.rb
    review_spec.rb
    conversation_spec.rb
    message_spec.rb
  requests/
    auth_spec.rb
    trips_spec.rb
    bookings_spec.rb
    reviews_spec.rb
    conversations_spec.rb
    messages_spec.rb
    planner/
      stats_spec.rb
      trips_spec.rb
      bookings_spec.rb
  factories/
    users.rb
    trips.rb
    bookings.rb
    reviews.rb
    conversations.rb
    messages.rb
```

### Key Test Cases

**Auth**:
- Signup traveler → 201 + token (no phone required)
- Signup planner without phone → 422
- Signup planner with phone → 201 + token
- Login with valid creds → 200 + token
- Login with bad password → 401
- `/auth/me` without token → 401
- `/auth/me` planner returns phone, bio, guild, rating

**Trips (Public vs Auth)**:
- `GET /trips` without token → 200 (can browse)
- `GET /trips/featured` without token → 200 (can browse)
- `GET /trips/:id` without token → 401 (must login to see details)
- `GET /trips/:id` with token → 200 (includes host.phone + driver info)
- Trip list does NOT expose host.phone or driver info

**Bookings**:
- Traveler requests trip → 201 pending
- Planner can't book → 403
- Duplicate booking → 422
- Book more seats than available → 422
- Planner confirms booking → status changes, seats_left decreases
- `GET /planner/trips/:id/passengers` shows confirmed travelers

**Passengers**:
- Only planner who owns the trip can see passengers
- Returns traveler name, email, phone, seats, amount
- Meta shows totalSeats, seatsBooked, seatsLeft, totalRevenue

**Role Authorization**:
- Traveler can't access `/planner/*` → 403
- Planner can't book a trip → 403
- Planner can only manage own trips

---

## 12. Deployment Notes

### Environment Variables

```bash
DATABASE_URL=postgres://...
RAILS_MASTER_KEY=...
SECRET_KEY_BASE=...
AWS_ACCESS_KEY_ID=...          # Active Storage S3
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=nazary-uploads
AWS_REGION=ap-south-1          # Mumbai (closest to Pakistan)
REDIS_URL=redis://...          # Action Cable + caching
```

### Production Checklist

- [ ] Switch Active Storage from `:local` to `:amazon` (S3)
- [ ] Configure Action Cable adapter from `:async` to `:redis`
- [ ] Set CORS origins to actual mobile API domain
- [ ] Add rate limiting (rack-attack gem)
- [ ] Add request logging (lograge gem)
- [ ] Enable SSL enforcement
- [ ] Set up background jobs (Solid Queue — Rails 8 default) for:
  - Push notifications (booking confirmations, new messages)
  - Image processing (Active Storage variants)
  - Stats aggregation caching
- [ ] Add health check endpoint: `GET /health` → 200
- [ ] SMS notifications via a Pakistan SMS gateway (e.g., Zong API, Jazz API)

### Mobile Client Update

When backend is ready, update the frontend:
1. Change `BASE_URL` in `src/api/client.ts`
2. Replace `devLogin*` calls in `authStore.ts` with real `authApi` calls
3. Add AsyncStorage token persistence
4. Connect Action Cable for real-time chat
5. Update mock data images to Pakistan northern areas
6. Update currency display from `$` to `Rs.` / `PKR`
7. Add driver info section to TripDetailsScreen
8. Add passenger list screen for planners
9. Make HomeScreen/SearchScreen work without auth (browse mode)
10. Show "Login to see details" prompt on trip cards for unauthenticated users

---

## 13. Endpoint ↔ Frontend Screen Mapping

| Screen                   | Endpoints Used                                                  | Auth Required |
|--------------------------|-----------------------------------------------------------------|---------------|
| **OnboardingScreen**     | — (static)                                                      | No            |
| **LoginScreen**          | `POST /auth/login`                                              | No            |
| **SignupScreen**         | `POST /auth/signup`                                             | No            |
| **HomeScreen**           | `GET /trips/featured`, `GET /categories`, `GET /collections`    | **No**        |
| **SearchScreen**         | `GET /trips?q=&tag=&sort=&location=`                            | **No**        |
| **TripDetailsScreen**    | `GET /trips/:id`, `GET /trips/:id/reviews`                      | **Yes**       |
| **MyTripsScreen**        | `GET /bookings`                                                 | Yes           |
| **ProfileScreen**        | `GET /auth/me`, `PATCH /users/me`                               | Yes           |
| **DashboardScreen**      | `GET /planner/stats`, `GET /planner/trips`, `GET /planner/bookings` | Yes (Planner) |
| **ManageTripsScreen**    | `GET /planner/trips`, `POST/PATCH /planner/trips`               | Yes (Planner) |
| **BookingRequests**      | `GET /planner/bookings`, `PATCH confirm/cancel`                 | Yes (Planner) |
| **PassengersScreen**     | `GET /planner/trips/:id/passengers`                             | Yes (Planner) |
| **ConversationsScreen**  | `GET /conversations`                                            | Yes           |
| **ChatScreen**           | `GET /conversations/:id/messages`, `POST messages`, WebSocket   | Yes           |
| **SettingsScreen**       | `PATCH /users/me`, `GET /trip_preferences`, `PUT /trip_preferences` | Yes           |
| **AgencyDetailScreen**   | `GET /agencies/:id`, `GET /agencies/:id/trips`                     | **No**        |

---

## 14. Data Access Rules Summary

| Data                           | Who Can See                           |
|--------------------------------|---------------------------------------|
| Trip cards (title, price, pic) | Everyone (no login needed)            |
| Trip details + itinerary       | Logged-in users only                  |
| Trip planner phone number      | Logged-in users only (in trip detail) |
| Driver details                 | Logged-in users only (in trip detail) |
| Passenger list                 | Trip planner (owner) only             |
| Booking requests               | Trip planner (owner) only             |
| Traveler's own bookings        | That traveler only                    |
| Chat messages                  | Conversation participants only        |
| Trip preferences               | That traveler only                    |
| Agency social links            | Everyone (on agency profile)          |
| Agency cover photo             | Everyone (on agency profile)          |
