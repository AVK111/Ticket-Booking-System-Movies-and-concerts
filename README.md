# 🎟️ Marquee — Ticket Booking System

### 🚀 Live Demo

**Frontend:** https://ticket-booking-system-movies-and-concerts.onrender.com

**Backend API:** https://marqueee.onrender.com

**API Test:** https://marqueee.onrender.com/api/shows

A full-stack ticket booking platform for movies and concerts. Customers browse events, book seats from a live visual seat map, get auto-released holds on checkout abandonment, join waitlists on sold-out shows, and receive QR-coded email tickets on confirmation.

**Stack:** MongoDB · Express.js · React (Vite) · Node.js · Socket.io · Cloudinary · Multer

---


## Features

- Role-based auth (customer / organiser / admin) via JWT
- Admin: venue + seat layout management
- Organiser: event/show creation with Cloudinary poster upload, category pricing and revenue dashboard
- Customer: browse/filter events, live seat map, seat hold with TTL, booking, cancellation, waitlist
- **Concurrency-safe seat holds** — atomic per-seat claims, no two customers can hold/book the same seat
- **TTL auto-release** — abandoned holds free up automatically via a scheduled job
- **Real-time seat map** — Socket.io broadcasts hold/release/booking events to everyone viewing a show
- **Waitlist with auto-assignment** — cancelled seats are offered to the next waitlisted customer with a time-limited offer, cascading to the next person if unclaimed
- QR-coded email tickets on booking confirmation (Nodemailer + `qrcode`)
- Cloudinary-powered poster uploads for movies and concerts
- Secure image upload pipeline using Multer + Cloudinary Storage

---
## System Architecture

 ```text
                                                              ┌─────────────────────────────┐
                                                              │        End Users            │
                                                              │ (Customer / Admin /         │
                                                              │  Organiser)                 │
                                                              └─────────────┬───────────────┘
                                                                            │
                                                                            ▼
                                                      ┌─────────────────────────────────────┐
                                                      │        React + Vite Frontend        │
                                                      │      (Render Static Site)           │
                                                      └─────────────┬───────────────────────┘
                                                                    │
                                                     REST API       │       Socket.IO
                                                                    │
                                                                    ▼
                                                      ┌─────────────────────────────────────┐
                                                      │      Express.js + Node.js API       │
                                                      │      (Render Web Service)           │
                                                      └──────┬──────────────┬───────────────┘
                                                             │              │
                                                             │              │
                                              ┌──────────────┘              └───────────────┐
                                              ▼                                             ▼
                                    ┌─────────────────────┐                     ┌─────────────────────┐
                                    │    MongoDB Atlas    │                     │     Cloudinary      │
                                    │                     │                     │                     │
                                    │ Users               │                     │ Movie Posters       │
                                    │ Venues              │                     │ Concert Posters     │
                                    │ Shows               │                     │ Image CDN           │
                                    │ Bookings            │                     └─────────────────────┘
                                    │ Seat Status         │
                                    │ Waitlists           │
                                    └──────────┬──────────┘
                                               │
                                               │
                                               ▼
                                    ┌─────────────────────────────┐
                                    │  Scheduled Cron Jobs        │
                                    │                             │
                                    │ • Auto-release seat holds   │
                                    │ • Waitlist processing        │
                                    └─────────────────────────────┘
                                    
                                               │
                                               ▼
                                    ┌─────────────────────────────┐
                                    │ Gmail SMTP (Nodemailer)     │
                                    │                             │
                                    │ • Booking confirmation      │
                                    │ • QR Ticket delivery        │
                                    └─────────────────────────────┘
```

## Project Structure

```
Ticket-Booking-System/
└── backend/
    └── src/
        ├── config/       # MongoDB & Cloudinary configuration
        ├── middleware/   # Auth (JWT + role guards)
        ├── controllers/  # Route handlers
        ├── models/       # Mongoose schemas
        ├── routes/       # Express routers
        ├── cron/         # TTL auto-release job
        ├── utils/        # Seat map generation, QR/email helpers, waitlist logic
        ├── uploads/      # Multer configuration
        └── scripts/      # Database seed script
└── frontend/
    └── src/
        ├── api/          # Axios client, socket.io client
        ├── context/      # Auth context
        ├── components/   # Shared UI (seat map, cards, navbar, ui kit)
        └── pages/        # Route-level pages
```

---


## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB URI, JWT secret, email SMTP creds
npm run seed            # optional: creates sample admin/organiser/customer + venue + show
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # point at your backend URL
npm run dev
```

### Environment Variables

**backend/.env**
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime |
| `CLIENT_URL` | Frontend URL |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | Sender email |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**frontend/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend Socket.io URL |

### Seed accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | password123 |
| Organiser | organiser@example.com | password123 |
| Customer | customer@example.com | password123 |

---

## Database Schema

| Model | Key Fields |
|---|---|
| **User** | name, email, password (hashed), role |
| **Venue** | name, address, createdBy, seatMap: `[{ row, category, seatCount }]` |
| **Show** | title, type, organiser, venue, image, showDateTime, pricing, status |
| **SeatStatus** | show, row, seatNumber, category, status (`available`/`held`/`booked`), heldBy, holdExpiresAt, waitlistOfferId |
| **Booking** | bookingRef, customer, show, seats: `[{ row, seatNumber, category, price }]`, totalAmount, status |
| **Waitlist** | show, category, customer, status (`waiting`/`offered`/`converted`/`expired`/`cancelled`), offeredSeat, offerExpiresAt |

One `SeatStatus` document exists per seat per show — this is the single source of truth the hold/booking/TTL/waitlist logic all operate on.

---
## Image Storage

Movie and concert posters are stored using **Cloudinary**.

### Upload Flow

Organizer/Admin uploads poster
        ↓
Multer processes multipart form data
        ↓
Cloudinary uploads image
        ↓
Cloudinary returns a secure URL
        ↓
URL is stored in MongoDB
        ↓
Frontend renders poster directly from Cloudinary CDN

### Benefits

- Images are not stored inside MongoDB.
- Smaller database size.
- Faster API responses.
- Global CDN delivery.
- Optimized image loading.
- Production-ready architecture.

## API Reference

### Auth (`/api/auth`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register as customer or organiser |
| POST | `/login` | Public | Returns JWT |
| GET | `/me` | Private | Current user profile |

### Venues (`/api/venues`)
| Method | Path | Access |
|---|---|---|
| GET | `/` `/:id` | Public |
| POST | `/` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |

### Shows (`/api/shows`)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | Public | Filters: `type`, `venue`, `from`, `to`, `search` |
| GET | `/:id` | Public | |
| POST | `/` | Organiser | Auto-generates seat map |
| PUT | `/:id` `/DELETE :id` | Organiser (own shows) | |
| GET | `/:id/seats` | Public (optional auth) | Returns seat grid; `mine:true` per seat if authenticated |
| POST | `/:id/hold` | Customer | Body: `{ seats: [{row, seatNumber}] }` |
| POST | `/:id/release` | Customer | Voluntary release before TTL |

### Bookings (`/api/bookings`)
| Method | Path | Access |
|---|---|---|
| POST | `/` | Customer — confirms held seats, sends QR email |
| GET | `/my` | Customer |
| GET | `/:id` | Customer (owner) |
| POST | `/:id/cancel` | Customer (owner) — triggers waitlist offer |

### Waitlist (`/api/waitlist`)
| Method | Path | Access |
|---|---|---|
| POST | `/` | Customer — join queue for a sold-out category |
| GET | `/my` | Customer |
| DELETE | `/:id` | Customer (owner, while `waiting`) |

### Organiser (`/api/organiser`)
| Method | Path | Access |
|---|---|---|
| GET | `/shows` | Organiser — own shows |
| GET | `/shows/:id/summary` | Organiser (own) — revenue, bookings, occupancy |

---

## Seat Hold, Concurrency & Waitlist Logic (summary)

See **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)** for the full write-up. Short version:

- **Hold:** each seat is claimed with a single atomic `findOneAndUpdate({ status: 'available' }, { status: 'held', ... })`. If two requests race for the same seat, MongoDB guarantees exactly one succeeds.
- **TTL release:** a cron job runs every 15s, finds `held` seats past `holdExpiresAt`, and atomically flips them back — the match condition (`status: 'held'`) itself prevents a race with a booking that just confirmed the same seat.
- **Waitlist cascade:** on cancellation (or an expired offer), the freed seat is offered to the oldest `waiting` entry for that category (FIFO via `createdAt`) instead of going straight to `available`. If nobody's waiting, it releases normally.
- **Real-time:** every hold/release/booking/waitlist-offer emits a Socket.io event to everyone currently viewing that show.

---

## Testing Concurrency

To verify two simultaneous requests for the same seat can't both succeed, fire two parallel hold requests and confirm only one returns success:

```bash
curl -X POST http://localhost:5000/api/shows/<showId>/hold -H "Authorization: Bearer <token1>" -H "Content-Type: application/json" -d "{\"seats\":[{\"row\":\"A\",\"seatNumber\":1}]}" &
curl -X POST http://localhost:5000/api/shows/<showId>/hold -H "Authorization: Bearer <token2>" -H "Content-Type: application/json" -d "{\"seats\":[{\"row\":\"A\",\"seatNumber\":1}]}" &
wait
```
One should return `200` with the seat held; the other should return `409 Some seats were already taken`.

---
## 🌐 Live Demo

### Frontend
🔗 https://ticket-booking-system-movies-and-concerts.onrender.com

### Backend API
🔗 https://marqueee.onrender.com

### API Test
🔗 https://marqueee.onrender.com/api/shows

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Render Static Site | https://ticket-booking-system-movies-and-concerts.onrender.com |
| Backend API | Render Web Service | https://marqueee.onrender.com |
| Database | MongoDB Atlas | Cloud Hosted | 
| Media Storage | Cloudinary | Cloud Hosted |

### Environment Variables

#### Backend

```env
CLIENT_URL=https://ticket-booking-system-movies-and-concerts.onrender.com
```

#### Frontend

```env
VITE_API_URL=https://marqueee.onrender.com/api
VITE_SOCKET_URL=https://marqueee.onrender.com
```
- Frontend → Vercel (set `VITE_API_URL`/`VITE_SOCKET_URL` to the deployed backend)
- Database → MongoDB Atlas
