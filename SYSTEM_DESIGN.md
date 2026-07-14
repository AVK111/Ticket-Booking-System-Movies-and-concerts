# System Design — Marquee Ticket Booking

## Seat Hold & TTL Mechanism

Every seat in a show is represented by a `SeatStatus` document — one per seat, per show — with a `status` field (`available` / `held` / `booked`), a `heldBy` reference, and a `holdExpiresAt` timestamp. This granularity is deliberate: rather than storing seat state as a nested array inside the `Show` document, each seat is its own document, which makes per-seat atomic updates straightforward and avoids the write-conflict risk of many customers concurrently modifying different parts of the same parent document.

When a customer selects seats and requests a hold, the server sets `status: 'held'`, `heldBy: <userId>`, and `holdExpiresAt: now + SEAT_HOLD_TTL_MINUTES` (default 10 minutes, configurable via env). The seat is now invisible as "available" to everyone else, but nothing has been sold yet.

Expiry is enforced by a `node-cron` job running every 15 seconds. It queries for seats where `status: 'held'` and `holdExpiresAt` has passed, and flips them back to `available`. A 15-second cron interval trades a small worst-case delay (seats could remain visibly "held" up to ~15s past their true expiry) for simplicity over a more precise but heavier approach like per-seat scheduled jobs. For this system's scale, that trade-off is the right one.

## Concurrency Prevention

The core correctness guarantee is a single atomic MongoDB operation:

```js
SeatStatus.findOneAndUpdate(
  { show, row, seatNumber, status: 'available' },
  { status: 'held', heldBy: userId, holdExpiresAt },
  { new: true }
)
```

The `status: 'available'` clause is part of the *query filter*, not applied after reading — MongoDB evaluates the filter and applies the update as one indivisible operation at the document level. If two customers attempt to hold the same seat within milliseconds of each other, only one `findOneAndUpdate` call will match (the first to reach MongoDB); the second returns `null` because by the time it runs, `status` is no longer `available`. No application-level locking, no distributed lock service, no read-then-write race window — the database's own atomicity is the entire mechanism.

This same pattern is reused everywhere seat state changes: holding, voluntary release, booking confirmation, cancellation, and waitlist offer assignment. Every one of these is a single conditional atomic update, never a read-modify-write pair.

For multi-seat requests, holds are claimed sequentially per seat, and if any single seat in the batch fails to claim (already taken), the seats successfully claimed earlier in that same request are rolled back to `available`. This keeps holds all-or-nothing from the customer's perspective without needing a database transaction — acceptable here because the batch sizes are small (a handful of seats per booking) and the rollback path is simple and fast.

## Waitlist Auto-Assignment Flow

When a booking is cancelled, or a waitlist offer expires unclaimed, the freed seat does not go directly to `available`. Instead, `offerNextWaitlistEntry(showId, category, seat)` runs:

1. Atomically claim the oldest `waiting` entry for that show + category via `findOneAndUpdate({ status: 'waiting' }, { status: 'offered' }, { sort: { createdAt: 1 } })`. The atomic claim-and-flip prevents two seats freeing up simultaneously from both being offered to the same waitlist customer.
2. If an entry was claimed, the seat is set to `held` with `heldBy` pointing at that customer, `holdExpiresAt` set to `now + WAITLIST_OFFER_TTL_MINUTES`, and a `waitlistOfferId` reference linking the seat back to the waitlist entry.
3. If nobody is waiting, the seat is released to `available` as normal.

FIFO ordering comes from sorting by `createdAt` rather than maintaining an explicit `position` field — this avoids the need to re-rank every remaining entry whenever someone leaves the queue.

## Time-Limited Offer Handling

A waitlist offer reuses the exact same `held` state and TTL cron job as a normal customer hold — the only difference is the `waitlistOfferId` field on the `SeatStatus` document, which tells the cron job how to handle expiry differently:

- **No `waitlistOfferId` (normal hold expired):** release straight to `available`.
- **`waitlistOfferId` present (offer expired):** mark that `Waitlist` entry as `expired`, then call `offerNextWaitlistEntry` again for the *same seat and category* — cascading the offer to the next person in line, rather than opening the seat to the general public.

This means a single cancelled seat can chain through several waitlist entries automatically (offer → expire → next offer → expire → ...) until either someone accepts or the queue is exhausted, entirely driven by the same 15-second cron sweep — no separate scheduling logic was needed for the waitlist case.

When a waitlisted customer accepts, they complete the exact same booking flow as any other customer (`POST /bookings`), since the seat is already `held` under their account. The only extra step is that `createBooking` checks whether the seat being booked has a `waitlistOfferId`, and if so, marks that waitlist entry `converted` and clears the reference.

*(~780 words)*
