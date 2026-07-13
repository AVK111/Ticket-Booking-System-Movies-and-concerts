import React from 'react'
import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { title: '', type: 'movie', venueId: '', showDateTime: '', pricing: [] };

const OrganiserDashboard = () => {
    const [shows, setShows] = useState([]);
    const [venues, setVenues] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [summaries, setSummaries] = useState({}); // showId -> summary data
    const [loadingSummary, setLoadingSummary] = useState(null);

    const loadShows = async () => {
        const { data } = await api.get('/organiser/shows');
        setShows(data);
    };

    useEffect(() => {
        loadShows();
        api.get('/venues').then((res) => setVenues(res.data));
    }, []);

    const selectedVenue = venues.find((v) => v._id === form.venueId);
    const venueCategories = selectedVenue ? [...new Set(selectedVenue.seatMap.map((r) => r.category))] : [];

    const handleVenueChange = (venueId) => {
        const venue = venues.find((v) => v._id === venueId);
        const categories = venue ? [...new Set(venue.seatMap.map((r) => r.category))] : [];
        setForm({ ...form, venueId, pricing: categories.map((category) => ({ category, price: 0 })) });
    };

    const updatePrice = (category, price) => {
        setForm({
            ...form,
            pricing: form.pricing.map((p) => (p.category === category ? { ...p, price: Number(price) } : p)),
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const { venueId, ...rest } = form;
            await api.post('/shows', { ...rest, venue: venueId });
            setForm(emptyForm);
            setShowForm(false);
            await loadShows();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create show');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this show? This cannot be undone.')) return;
        await api.delete(`/shows/${id}`);
        await loadShows();
    };

    const toggleSummary = async (id) => {
        if (summaries[id]) {
            setSummaries((prev) => ({ ...prev, [id]: undefined }));
            return;
        }
        setLoadingSummary(id);
        const { data } = await api.get(`/organiser/shows/${id}/summary`);
        setSummaries((prev) => ({ ...prev, [id]: data }));
        setLoadingSummary(null);
    };

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Your shows</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New show'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="card" style={{ marginBottom: 24 }}>
                    <div className="field">
                        <label className="label">Title</label>
                        <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>

                    <div className="field">
                        <label className="label">Type</label>
                        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            <option value="movie">Movie</option>
                            <option value="concert">Concert</option>
                        </select>
                    </div>

                    <div className="field">
                        <label className="label">Venue</label>
                        <select className="input" required value={form.venueId} onChange={(e) => handleVenueChange(e.target.value)}>
                            <option value="">Select a venue…</option>
                            {venues.map((v) => (
                                <option key={v._id} value={v._id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label className="label">Date & time</label>
                        <input
                            className="input"
                            type="datetime-local"
                            required
                            value={form.showDateTime}
                            onChange={(e) => setForm({ ...form, showDateTime: e.target.value })}
                        />
                    </div>

                    {venueCategories.length > 0 && (
                        <div className="field">
                            <label className="label">Pricing per category</label>
                            {venueCategories.map((category) => (
                                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <span style={{ width: 100, fontSize: '0.9rem', color: 'var(--text-dim)' }}>{category}</span>
                                    <input
                                        className="input"
                                        type="number"
                                        min="0"
                                        placeholder="Price"
                                        value={form.pricing.find((p) => p.category === category)?.price || ''}
                                        onChange={(e) => updatePrice(category, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <p className="error-text">{error}</p>}

                    <button className="btn btn-primary" disabled={busy}>
                        {busy ? 'Creating…' : 'Create show'}
                    </button>
                </form>
            )}

            {shows.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>You haven't created any shows yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {shows.map((show) => (
                        <div key={show._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px' }}>{show.title}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {show.venue?.name} · {new Date(show.showDateTime).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-outline" onClick={() => toggleSummary(show._id)}>
                                        {loadingSummary === show._id ? 'Loading…' : summaries[show._id] ? 'Hide summary' : 'View summary'}
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(show._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {summaries[show._id] && (
                                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                    <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                                        <Stat label="Bookings" value={summaries[show._id].totalBookings} />
                                        <Stat label="Seats sold" value={summaries[show._id].totalSeatsSold} />
                                        <Stat label="Revenue" value={`₹${summaries[show._id].totalRevenue}`} />
                                    </div>

                                    <table style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-dim)', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th>Category</th>
                                                <th>Available</th>
                                                <th>Held</th>
                                                <th>Booked</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summaries[show._id].occupancy.map((o) => {
                                                const cat = summaries[show._id].byCategory.find((c) => c.category === o.category);
                                                return (
                                                    <tr key={o.category}>
                                                        <td>{o.category}</td>
                                                        <td>{o.available}</td>
                                                        <td>{o.held}</td>
                                                        <td>{o.booked}</td>
                                                        <td>₹{cat?.revenue || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Stat = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{label}</div>
    </div>
);

export default OrganiserDashboard;