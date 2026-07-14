// Table-based layout on purpose — most email clients (Outlook especially)
// don't reliably support modern CSS, so we stick to inline styles + tables.
// A light body with dark brand accents renders consistently everywhere,
// unlike a full dark theme which Outlook/older clients often break.

const wrapper = (bodyHtml) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

            <!-- Brand header -->
            <tr>
              <td style="background:#09090b;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">🎟️ Marquee</span>
              </td>
            </tr>

            ${bodyHtml}

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  This is an automated message from Marquee. If you didn't expect this email, you can ignore it.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const ctaButton = (href, label) => `
  <a href="${href}" style="display:inline-block;background:#E50914;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">
    ${label}
  </a>
`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#71717a;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#18181b;font-weight:600;text-align:right;">${value}</td>
  </tr>
`;

// Used by bookingController.createBooking
const bookingConfirmationEmail = ({ show, booking, seatList, totalAmount }) => {
  const body = `
    <tr>
      <td style="padding:32px;">
        <div style="width:48px;height:48px;border-radius:50%;background:#22c55e1a;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;">✅</span>
        </div>
        <h1 style="margin:0 0 6px;font-size:22px;color:#18181b;">Booking confirmed</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;">Your QR ticket is below — show it at entry.</p>

        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#18181b;">${show.title}</p>
        <p style="margin:0 0 20px;font-size:13px;color:#71717a;">${new Date(show.showDateTime).toLocaleString()}</p>

        <table role="presentation" width="100%" style="margin-bottom:20px;">
          ${detailRow('Seats', seatList)}
          ${detailRow('Total', `₹${totalAmount}`)}
          ${detailRow('Booking reference', booking.bookingRef)}
        </table>

        <div style="text-align:center;margin:24px 0;">
          <img src="cid:qrcode" alt="Booking QR Code" style="width:180px;height:180px;border-radius:12px;border:1px solid #eee;" />
        </div>

        <div style="text-align:center;">
          ${ctaButton(`${process.env.CLIENT_URL || ''}/my-bookings`, 'View my bookings')}
        </div>
      </td>
    </tr>
  `;
  return wrapper(body);
};

// Used by offerNextWaitlistEntry
const waitlistOfferEmail = ({ show, seat, category, offerExpiresAt, showId }) => {
  const body = `
    <tr>
      <td style="padding:32px;">
        <div style="width:48px;height:48px;border-radius:50%;background:#f59e0b1a;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;">🔔</span>
        </div>
        <h1 style="margin:0 0 6px;font-size:22px;color:#18181b;">A seat opened up!</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#71717a;">You're next in line — act fast, this offer is time-limited.</p>

        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#18181b;">${show?.title || 'Your event'}</p>

        <table role="presentation" width="100%" style="margin-bottom:24px;">
          ${detailRow('Seat', `${seat.row}${seat.seatNumber} (${category})`)}
          ${detailRow('Offer expires', new Date(offerExpiresAt).toLocaleString())}
        </table>

        <div style="text-align:center;">
          ${ctaButton(`${process.env.CLIENT_URL || ''}/shows/${showId}`, 'Complete your booking')}
        </div>
      </td>
    </tr>
  `;
  return wrapper(body);
};

module.exports = { bookingConfirmationEmail, waitlistOfferEmail };