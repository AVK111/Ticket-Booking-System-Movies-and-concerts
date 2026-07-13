import React from 'react'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const statusBadge = (status) => {
    const colors = { confirmed: 'var(--available)', cancelled: 'var(--danger)' };
    return (
        <span className="badge" style={{ background: `${colors[status]}22`, color: colors[status] }}>
            {status}
        </span>
    );
};

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        const { data } = await api.get('/bookings/my');
        setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleCancel = async (id) => {
        if (!confirm('Cancel this booking? The seat will be released or offered to the waitlist.')) return;
        setBusyId(id);
        try {
            await api.post(`/bookings/${id}/cancel`);
            await load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>My bookings</h1>

            {loading ? (
                <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
            ) : bookings.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>
                    No bookings yet. <Link to="/">Browse shows</Link>
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bookings.map((b) => (
                        <div key={b._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{b.show?.title}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {new Date(b.show?.showDateTime).toLocaleString()}
                                    </p>
                                </div>
                                {statusBadge(b.status)}
                            </div>

                            <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                Seats: {b.seats.map((s) => `${s.row}${s.seatNumber}`).join(', ')} · Total: ₹{b.totalAmount}
                            </div>
                            <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Ref: {b.bookingRef}</div>

                            {b.status === 'confirmed' && (
                                <button
                                    className="btn btn-outline"
                                    style={{ marginTop: 12 }}
                                    disabled={busyId === b._id}
                                    onClick={() => handleCancel(b._id)}
                                >
                                    {busyId === b._id ? 'Cancelling…' : 'Cancel booking'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;