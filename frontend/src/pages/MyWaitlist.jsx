import React from 'react'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const statusColors = {
    waiting: 'var(--text-dim)',
    offered: 'var(--held)',
    converted: 'var(--available)',
    expired: 'var(--danger)',
    cancelled: 'var(--text-dim)',
};

const MyWaitlist = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        const { data } = await api.get('/waitlist/my');
        setEntries(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleLeave = async (id) => {
        setBusyId(id);
        try {
            await api.delete(`/waitlist/${id}`);
            await load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>My waitlist</h1>

            {loading ? (
                <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
            ) : entries.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>You're not on any waitlists right now.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {entries.map((e) => (
                        <div key={e._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{e.show?.title}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {e.category} · {new Date(e.show?.showDateTime).toLocaleString()}
                                    </p>
                                </div>
                                <span className="badge" style={{ background: `${statusColors[e.status]}22`, color: statusColors[e.status] }}>
                                    {e.status}
                                </span>
                            </div>

                            {e.status === 'offered' && (
                                <div style={{ marginTop: 12 }}>
                                    <p style={{ color: 'var(--held)', fontSize: '0.85rem', marginBottom: 8 }}>
                                        Seat {e.offeredSeat?.row}
                                        {e.offeredSeat?.seatNumber} offered — complete your booking before{' '}
                                        {new Date(e.offerExpiresAt).toLocaleTimeString()}
                                    </p>
                                    <Link to={`/shows/${e.show?._id}`}>
                                        <button className="btn btn-primary">Complete booking</button>
                                    </Link>
                                </div>
                            )}

                            {e.status === 'waiting' && (
                                <button
                                    className="btn btn-outline"
                                    style={{ marginTop: 12 }}
                                    disabled={busyId === e._id}
                                    onClick={() => handleLeave(e._id)}
                                >
                                    {busyId === e._id ? 'Leaving…' : 'Leave waitlist'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWaitlist;