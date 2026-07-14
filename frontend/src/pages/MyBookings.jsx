import React from 'react'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Download, Ticket, Calendar, TrendingUp, XCircle } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { notify } from '../lib/toast';

const statusVariant = { confirmed: 'success', cancelled: 'error' };

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);

    const load = async () => {
        setLoading(true);
        const { data } = await api.get('/bookings/my');
        setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleCancel = async () => {
        const id = confirmId;
        setConfirmId(null);
        setBusyId(id);
        try {
            await api.post(`/bookings/${id}/cancel`);
            notify.success('Booking cancelled');
            await load();
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setBusyId(null);
        }
    };

    const downloadTicket = async (booking) => {
        // Regenerated client-side from the booking reference already on the
        // record — no new backend endpoint needed, same QR payload as the email.
        const dataUrl = await QRCode.toDataURL(booking.bookingRef, { width: 400, margin: 2 });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${booking.bookingRef}.png`;
        link.click();
    };

    const now = Date.now();
    const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.show?.showDateTime) > now);
    const past = bookings.filter((b) => !(b.status === 'confirmed' && new Date(b.show?.showDateTime) > now));
    const totalSpent = bookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.totalAmount, 0);

    return (
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
            <h1 className="font-display text-2xl font-bold text-text mb-6">My bookings</h1>

            {!loading && bookings.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Stat icon={Ticket} label="Total bookings" value={bookings.length} />
                    <Stat icon={Calendar} label="Upcoming" value={upcoming.length} />
                    <Stat icon={TrendingUp} label="Total spent" value={`₹${totalSpent}`} />
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <p className="text-text-dim text-sm">
                    No bookings yet. <Link to="/" className="text-accent hover:underline">Browse shows</Link>
                </p>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <Section title="Upcoming" bookings={upcoming} busyId={busyId} onCancel={setConfirmId} onDownload={downloadTicket} />
                    )}
                    {past.length > 0 && (
                        <Section title="Past & cancelled" bookings={past} busyId={busyId} onCancel={setConfirmId} onDownload={downloadTicket} muted />
                    )}
                </>
            )}

            <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Cancel booking?">
                <p className="text-sm text-text-dim mb-5">
                    Your seat will be released or offered to the next person on the waitlist. This can't be undone.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmId(null)}>
                        Keep booking
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={handleCancel}>
                        Cancel it
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const Section = ({ title, bookings, busyId, onCancel, onDownload, muted }) => (
    <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-3">{title}</h2>
        <div className="relative pl-5 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {bookings.map((b, i) => (
                <motion.div
                    key={b._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative"
                >
                    <span
                        className={`absolute -left-5 top-5 w-2.5 h-2.5 rounded-full border-2 border-bg ${b.status === 'confirmed' ? 'bg-success' : 'bg-text-faint'
                            }`}
                    />
                    <Card className={`p-4 ${muted ? 'opacity-70' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="font-display font-semibold text-text">{b.show?.title}</h3>
                                <p className="text-xs text-text-faint mt-0.5">{new Date(b.show?.showDateTime).toLocaleString()}</p>
                            </div>
                            <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                        </div>
                        <p className="text-xs text-text-dim mb-3">
                            Seats: {b.seats.map((s) => `${s.row}${s.seatNumber}`).join(', ')} · ₹{b.totalAmount} · Ref {b.bookingRef}
                        </p>
                        {b.status === 'confirmed' && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" icon={Download} onClick={() => onDownload(b)}>
                                    Ticket
                                </Button>
                                <Button size="sm" variant="ghost" icon={XCircle} disabled={busyId === b._id} onClick={() => onCancel(b._id)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>
            ))}
        </div>
    </div>
);

const Stat = ({ icon: Icon, label, value }) => (
    <Card className="p-4">
        <Icon size={16} className="text-accent mb-2" />
        <p className="text-xl font-display font-bold text-text">{value}</p>
        <p className="text-xs text-text-faint">{label}</p>
    </Card>
);

export default MyBookings;