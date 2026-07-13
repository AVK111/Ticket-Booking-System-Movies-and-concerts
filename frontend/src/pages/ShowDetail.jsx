import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';

const key = (row, seatNumber) => `${row}-${seatNumber}`;

const ShowDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [show, setShow] = useState(null);
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [heldByMe, setHeldByMe] = useState(new Set());
    const [holdExpiresAt, setHoldExpiresAt] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const isCustomer = user?.role === 'customer';

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const [showRes, seatsRes] = await Promise.all([
                api.get(`/shows/${id}`),
                api.get(`/shows/${id}/seats`),
            ]);
            if (cancelled) return;
            setShow(showRes.data);
            setRows(seatsRes.data.rows);

            // Reconstruct "my active hold" from the server (mine:true + holdExpiresAt)
            // so a page refresh doesn't strand the user mid-checkout.
            const mySeats = new Set();
            let myExpiry = null;
            for (const r of seatsRes.data.rows) {
                for (const s of r.seats) {
                    if (s.mine && s.status === 'held') {
                        mySeats.add(key(r.row, s.seatNumber));
                        myExpiry = s.holdExpiresAt;
                    }
                }
            }
            if (mySeats.size > 0) {
                setHeldByMe(mySeats);
                setHoldExpiresAt(myExpiry);
            }

            setLoading(false);
        };
        load();

        const socket = getSocket();
        socket.emit('joinShow', id);

        const handleUpdate = ({ seats }) => {
            setRows((prev) =>
                prev.map((r) => ({
                    ...r,
                    seats: r.seats.map((s) => {
                        const match = seats.find((u) => u.row === r.row && u.seatNumber === s.seatNumber);
                        return match ? { ...s, status: match.status } : s;
                    }),
                }))
            );
        };
        socket.on('seatUpdate', handleUpdate);

        return () => {
            cancelled = true;
            socket.emit('leaveShow', id);
            socket.off('seatUpdate', handleUpdate);
        };
    }, [id]);

    useEffect(() => {
        clearInterval(timerRef.current);
        if (!holdExpiresAt) {
            setSecondsLeft(null);
            return;
        }
        const tick = () => {
            const diff = Math.round((new Date(holdExpiresAt) - Date.now()) / 1000);
            if (diff <= 0) {
                setSecondsLeft(0);
                setHoldExpiresAt(null);
                setHeldByMe(new Set());
                setError('Your hold expired. Please select seats again.');
                clearInterval(timerRef.current);
            } else {
                setSecondsLeft(diff);
            }
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [holdExpiresAt]);

    const categoryAvailability = useMemo(() => {
        const counts = {};
        for (const r of rows) {
            for (const s of r.seats) {
                counts[s.category] = counts[s.category] || 0;
                if (s.status === 'available') counts[s.category] += 1;
            }
        }
        return counts;
    }, [rows]);

    const priceMap = useMemo(() => {
        const map = {};
        for (const p of show?.pricing || []) map[p.category] = p.price;
        return map;
    }, [show]);

    const selectedTotal = useMemo(() => {
        let total = 0;
        for (const r of rows) {
            for (const s of r.seats) {
                if (selected.has(key(r.row, s.seatNumber))) total += priceMap[s.category] || 0;
            }
        }
        return total;
    }, [selected, rows, priceMap]);

    const toggleSeat = (row, seatNumber) => {
        if (heldByMe.size > 0) return;
        setError('');
        setSelected((prev) => {
            const next = new Set(prev);
            const k = key(row, seatNumber);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });
    };

    const handleHold = async () => {
        setBusy(true);
        setError('');
        try {
            const seats = [...selected].map((k) => {
                const [row, seatNumber] = k.split('-');
                return { row, seatNumber: Number(seatNumber) };
            });
            const { data } = await api.post(`/shows/${id}/hold`, { seats });
            setHeldByMe(new Set(selected));
            setSelected(new Set());
            setHoldExpiresAt(data.holdExpiresAt);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not hold seats — try again');
        } finally {
            setBusy(false);
        }
    };

    const handleRelease = async () => {
        setBusy(true);
        try {
            const seats = [...heldByMe].map((k) => {
                const [row, seatNumber] = k.split('-');
                return { row, seatNumber: Number(seatNumber) };
            });
            await api.post(`/shows/${id}/release`, { seats });
        } finally {
            setHeldByMe(new Set());
            setHoldExpiresAt(null);
            setBusy(false);
        }
    };

    const handleConfirm = async () => {
        setBusy(true);
        setError('');
        try {
            const seats = [...heldByMe].map((k) => {
                const [row, seatNumber] = k.split('-');
                return { row, seatNumber: Number(seatNumber) };
            });
            const { data } = await api.post('/bookings', { showId: id, seats });
            setBooking(data);
            setHeldByMe(new Set());
            setHoldExpiresAt(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed — your hold may have expired');
        } finally {
            setBusy(false);
        }
    };

    const joinWaitlist = async (category) => {
        setError('');
        try {
            await api.post('/waitlist', { showId: id, category });
            alert(`Added to the waitlist for ${category}. We'll email you if a seat opens up.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not join waitlist');
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: 40 }}>Loading…</div>;
    if (!show) return <div className="container" style={{ paddingTop: 40 }}>Show not found.</div>;

    if (booking) {
        return (
            <div className="container" style={{ maxWidth: 480, paddingTop: 60 }}>
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Booking confirmed</h2>
                    <p style={{ color: 'var(--text-dim)' }}>
                        Reference: <strong style={{ color: 'var(--text)' }}>{booking.bookingRef}</strong>
                    </p>
                    <p style={{ color: 'var(--text-dim)' }}>Total paid: ₹{booking.totalAmount}</p>
                    <p style={{ color: 'var(--text-dim)' }}>A confirmation email with your QR ticket is on its way.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
            <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                {show.type}
            </span>
            <h1 style={{ margin: '10px 0 4px' }}>{show.title}</h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
                {show.venue?.name} · {new Date(show.showDateTime).toLocaleString()}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
                <div className="card">
                    <SeatMap rows={rows} selected={selected} onToggleSeat={toggleSeat} myHeldSeats={heldByMe} />
                </div>

                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Pricing</h3>
                        {show.pricing.map((p) => (
                            <div
                                key={p.category}
                                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 6, color: 'var(--text-dim)' }}
                            >
                                <span>{p.category}</span>
                                <span>₹{p.price}</span>
                            </div>
                        ))}
                    </div>

                    {isCustomer && Object.entries(categoryAvailability).some(([, count]) => count === 0) && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Sold out</h3>
                            {Object.entries(categoryAvailability)
                                .filter(([, count]) => count === 0)
                                .map(([category]) => (
                                    <button
                                        key={category}
                                        className="btn btn-outline"
                                        style={{ width: '100%', marginBottom: 8 }}
                                        onClick={() => joinWaitlist(category)}
                                    >
                                        Join {category} waitlist
                                    </button>
                                ))}
                        </div>
                    )}

                    {isCustomer && (
                        <div className="card">
                            {heldByMe.size === 0 ? (
                                <>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                        {selected.size} seat(s) selected · ₹{selectedTotal}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        disabled={selected.size === 0 || busy}
                                        onClick={handleHold}
                                    >
                                        {busy ? 'Holding…' : 'Hold seats'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p style={{ color: 'var(--held)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        Held —{' '}
                                        {secondsLeft != null
                                            ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
                                            : ''}{' '}
                                        left
                                    </p>
                                    <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }} disabled={busy} onClick={handleConfirm}>
                                        {busy ? 'Confirming…' : 'Confirm booking'}
                                    </button>
                                    <button className="btn btn-outline" style={{ width: '100%' }} disabled={busy} onClick={handleRelease}>
                                        Release seats
                                    </button>
                                </>
                            )}
                            {error && <p className="error-text">{error}</p>}
                        </div>
                    )}

                    {!isCustomer && (
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Log in as a customer to book seats.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShowDetail;