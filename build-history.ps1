# build-history.ps1
# Run this ONCE from your project root: D:\Ticket-Booking-System
# Recreates a step-by-step commit history matching how the app was actually built.
# Safe to review before running — it only stages/commits, never force-pushes or deletes.

# --- 0. Init ---
git init
git branch -M main

# Make sure .gitignore exists BEFORE the first add, so node_modules/.env never get staged
@"
node_modules/
dist/
build/
.env
"@ | Out-File -Encoding utf8 .gitignore

git add .gitignore
git commit -m "chore: initial gitignore"

# --- 1. Backend foundation ---
git add backend/package.json backend/.env.example backend/.gitignore backend/src/config/db.js backend/src/server.js
git commit -m "chore: initialize backend project structure (express, mongoose, dotenv)"

# --- 2. Auth + role-based access ---
git add backend/src/models/User.js backend/src/utils/generateToken.js backend/src/middleware/auth.js backend/src/controllers/authController.js backend/src/routes/authRoutes.js backend/src/routes/adminRoutes.js backend/src/server.js
git commit -m "feat: add JWT auth with role-based access control (customer/organiser/admin)"

# --- 3. Venue + Show CRUD ---
git add backend/src/models/Venue.js backend/src/models/Show.js backend/src/controllers/venueController.js backend/src/controllers/showController.js backend/src/routes/venueRoutes.js backend/src/routes/showRoutes.js backend/src/server.js
git commit -m "feat: add venue and show CRUD APIs with per-category pricing"

# --- 4. Seat map generation ---
git add backend/src/models/SeatStatus.js backend/src/utils/generateSeatMapForShow.js backend/src/controllers/seatController.js backend/src/routes/seatRoutes.js backend/src/controllers/showController.js backend/src/server.js
git commit -m "feat: auto-generate per-seat status map when a show is created"

# --- 5. Seat hold + concurrency + TTL release ---
git add backend/src/controllers/holdController.js backend/src/routes/holdRoutes.js backend/src/cron/releaseExpiredHolds.js backend/src/server.js backend/package.json backend/.env.example
git commit -m "feat: add atomic seat hold with TTL auto-release (concurrency-safe)"

# --- 6. Socket.io live seat updates ---
git add backend/src/socket.js backend/src/controllers/holdController.js backend/src/cron/releaseExpiredHolds.js backend/src/server.js backend/package.json
git commit -m "feat: broadcast live seat map updates via socket.io"

# --- 7. Booking + QR + email ---
git add backend/src/models/Booking.js backend/src/utils/generateBookingRef.js backend/src/utils/sendEmail.js backend/src/controllers/bookingController.js backend/src/routes/bookingRoutes.js backend/src/server.js backend/package.json backend/.env.example
git commit -m "feat: confirm bookings with QR code generation and email delivery"

# --- 8. Waitlist + auto-assignment ---
git add backend/src/models/Waitlist.js backend/src/utils/offerNextWaitlistEntry.js backend/src/controllers/waitlistController.js backend/src/routes/waitlistRoutes.js backend/src/models/SeatStatus.js backend/src/controllers/bookingController.js backend/src/cron/releaseExpiredHolds.js backend/src/server.js backend/.env.example
git commit -m "feat: add waitlist with time-limited offers and auto-assignment on cancellation"

# --- 9. Organiser reporting ---
git add backend/src/controllers/organiserController.js backend/src/routes/organiserRoutes.js backend/src/server.js
git commit -m "feat: add organiser booking summary and revenue-per-event endpoints"

# --- 10. Seed script ---
git add backend/src/scripts/seed.js backend/package.json
git commit -m "chore: add database seed script for local testing"

# --- 11. Backend bug fixes found during testing ---
git add backend/src/controllers/authController.js backend/src/middleware/auth.js backend/src/controllers/seatController.js backend/src/routes/seatRoutes.js
git commit -m "fix: normalize login email; expose per-viewer seat hold ownership"

# --- 12. Frontend scaffold + auth ---
git add frontend/index.html frontend/vite.config.js frontend/package.json frontend/.env.example frontend/.gitignore frontend/src/main.jsx frontend/src/App.jsx frontend/src/index.css frontend/src/api/axios.js frontend/src/api/socket.js frontend/src/context/AuthContext.jsx frontend/src/components/ProtectedRoute.jsx frontend/src/components/Navbar.jsx frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx frontend/src/pages/Home.jsx frontend/src/pages/ComingSoon.jsx frontend/public
git commit -m "feat: scaffold React frontend with auth pages and protected routing"

# --- 13. Seat map + booking UI ---
git add frontend/src/components/SeatMap.jsx frontend/src/pages/ShowDetail.jsx frontend/src/App.jsx
git commit -m "feat: add live seat map with hold/confirm/release booking flow"

# --- 14. Customer bookings + waitlist UI ---
git add frontend/src/pages/MyBookings.jsx frontend/src/pages/MyWaitlist.jsx frontend/src/App.jsx
git commit -m "feat: add booking history and waitlist status pages"

# --- 15. Organiser dashboard UI ---
git add frontend/src/pages/OrganiserDashboard.jsx frontend/src/App.jsx
git commit -m "feat: add organiser dashboard for show creation and revenue summaries"

# --- 16. Admin venue management UI ---
git add frontend/src/pages/AdminVenues.jsx frontend/src/App.jsx
git commit -m "feat: add admin venue and seat layout management UI"

# --- 17. Frontend bug fixes found during testing ---
git add frontend/src/pages/OrganiserDashboard.jsx frontend/src/pages/ShowDetail.jsx
git commit -m "fix: correct venue field name mismatch; persist active seat hold across page refresh"

# --- 18. Design system foundation ---
git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/src/index.css frontend/src/components/ui frontend/src/lib/toast.js frontend/src/App.jsx
git commit -m "feat(ui): introduce Tailwind v4 design system, base component kit, toasts"

# --- 19. Navbar redesign ---
git add frontend/src/components/Navbar.jsx
git commit -m "feat(ui): redesign navbar with glass blur, avatar menu, mobile nav"

# --- 20. Home page redesign ---
git add frontend/src/components/EventCard.jsx frontend/src/components/HorizontalRow.jsx frontend/src/pages/Home.jsx
git commit -m "feat(ui): redesign browse page with Netflix-style rows and event cards"

# --- 21. Catch-all for anything not explicitly staged above ---
git add .
git commit -m "chore: remaining project files" --allow-empty

Write-Host ""
Write-Host "Done. Review with: git log --oneline"
Write-Host "Then connect and push:"
Write-Host "  git remote add origin https://github.com/<your-username>/<repo-name>.git"
Write-Host "  git push -u origin main"
