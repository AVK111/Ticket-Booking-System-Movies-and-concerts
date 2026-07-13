import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, Film, Music2, CheckCircle2, Ticket } from 'lucide-react';
import api from '../api/axios';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { notify } from '../lib/toast';

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
            const msg = err.response?.data?.message || 'Could not hold seats — try again';
            setError(msg);
            notify.error(msg);
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
            notify.success('Booking confirmed');
        } catch (err) {
            const msg = err.response?.data?.message || 'Booking failed — your hold may have expired';
            setError(msg);
            notify.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const joinWaitlist = async (category) => {
        setError('');
        try {
            await api.post('/waitlist', { showId: id, category });
            notify.success(`Added to the ${category} waitlist — we'll email you if a seat opens up`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not join waitlist';
            setError(msg);
            notify.error(msg);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 pt-14">
                <div className="h-56 rounded-2xl bg-surface border border-border animate-pulse mb-8" />
                <div className="grid grid-cols-[1fr_340px] gap-8">
                    <div className="h-96 rounded-2xl bg-surface border border-border animate-pulse" />
                    <div className="h-64 rounded-2xl bg-surface border border-border animate-pulse" />
                </div>
            </div>
        );
    }
    if (!show) return <div className="max-w-6xl mx-auto px-6 pt-14 text-text-dim">Show not found.</div>;

    const TypeIcon = show.type === 'concert' ? Music2 : Film;

    if (booking) {
        return (
            <div className="max-w-md mx-auto px-6 pt-20 pb-20">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-4">
                            <CheckCircle2 size={28} className="text-success" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-text">Booking confirmed</h2>
                        <p className="text-text-dim text-sm mt-1">A QR ticket has been emailed to you.</p>
                    </div>

                    {/* Boarding-pass style ticket */}
                    <div className="relative bg-gradient-to-br from-surface to-bg-secondary border border-border rounded-2xl overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-accent to-accent-2" />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Ticket size={16} className="text-accent" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-text-faint">Marquee Ticket</span>
                            </div>
                            <h3 className="font-display font-bold text-lg text-text mb-1">{show.title}</h3>
                            <p className="text-text-dim text-sm mb-5">
                                {show.venue?.name} · {new Date(show.showDateTime).toLocaleString()}
                            </p>

                            <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                                <div>
                                    <p className="text-[10px] uppercase text-text-faint tracking-wide">Reference</p>
                                    <p className="text-sm font-semibold text-text">{booking.bookingRef}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-text-faint tracking-wide">Total</p>
                                    <p className="text-sm font-semibold text-text">₹{booking.totalAmount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link to="/my-bookings">
                        <Button variant="outline" className="w-full mt-5">
                            View my bookings
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-20">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text mb-5">
                <ArrowLeft size={14} /> Back to browse
            </Link>

            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative h-52 rounded-2xl overflow-hidden border border-border mb-8 flex items-end p-6 bg-gradient-to-br ${show.type === 'concert' ? 'from-accent-2/25' : 'from-accent/25'
                    } via-bg-secondary to-bg-secondary`}
            >
                <TypeIcon size={120} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/[0.06]" />
                <div className="relative z-10">
                    <Badge variant={show.type === 'concert' ? 'accent2' : 'accent'} className="mb-3">
                        {show.type}
                    </Badge>
                    <h1 className="font-display text-3xl font-bold text-text">{show.title}</h1>
                </div>
            </motion.div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-dim mb-8">
                <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {show.venue?.name}
                </span>
                <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> {new Date(show.showDateTime).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {new Date(show.showDateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </span>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                <Card className="p-6">
                    <SeatMap rows={rows} selected={selected} onToggleSeat={toggleSeat} myHeldSeats={heldByMe} />
                </Card>

                <div className="space-y-4 lg:sticky lg:top-24 self-start">
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-text mb-3">Pricing</h3>
                        {show.pricing.map((p) => (
                            <div key={p.category} className="flex justify-between text-sm text-text-dim mb-1.5">
                                <span>{p.category}</span>
                                <span className="text-text">₹{p.price}</span>
                            </div>
                        ))}
                    </Card>

                    {isCustomer && Object.entries(categoryAvailability).some(([, count]) => count === 0) && (
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-text mb-3">Sold out</h3>
                            <div className="space-y-2">
                                {Object.entries(categoryAvailability)
                                    .filter(([, count]) => count === 0)
                                    .map(([category]) => (
                                        <Button key={category} variant="outline" className="w-full" onClick={() => joinWaitlist(category)}>
                                            Join {category} waitlist
                                        </Button>
                                    ))}
                            </div>
                        </Card>
                    )}

                    {isCustomer && (
                        <Card className="p-5">
                            {heldByMe.size === 0 ? (
                                <>
                                    <p className="text-sm text-text-dim mb-3">
                                        {selected.size} seat(s) selected · <span className="text-text font-medium">₹{selectedTotal}</span>
                                    </p>
                                    <Button className="w-full" disabled={selected.size === 0} loading={busy} onClick={handleHold}>
                                        Hold seats
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-warning mb-3">
                                        Held —{' '}
                                        {secondsLeft != null
                                            ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
                                            : ''}{' '}
                                        left
                                    </p>
                                    <Button className="w-full mb-2" loading={busy} onClick={handleConfirm}>
                                        Confirm booking
                                    </Button>
                                    <Button variant="outline" className="w-full" disabled={busy} onClick={handleRelease}>
                                        Release seats
                                    </Button>
                                </>
                            )}
                            {error && <p className="text-xs text-error mt-2">{error}</p>}
                        </Card>
                    )}

                    {!isCustomer && (
                        <Card className="p-5">
                            <p className="text-sm text-text-dim">Log in as a customer to book seats.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShowDetail;