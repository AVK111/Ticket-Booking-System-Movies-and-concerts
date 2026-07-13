import React from 'react'
import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { name: '', address: '', seatMap: [{ row: '', category: '', seatCount: 10 }] };

const AdminVenues = () => {
    const [venues, setVenues] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const loadVenues = async () => {
        const { data } = await api.get('/venues');
        setVenues(data);
    };

    useEffect(() => {
        loadVenues();
    }, []);

    const startCreate = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError('');
    };

    const startEdit = (venue) => {
        setForm({ name: venue.name, address: venue.address, seatMap: venue.seatMap });
        setEditingId(venue._id);
        setShowForm(true);
        setError('');
    };

    const updateRow = (index, field, value) => {
        const seatMap = [...form.seatMap];
        seatMap[index] = { ...seatMap[index], [field]: field === 'seatCount' ? Number(value) : value };
        setForm({ ...form, seatMap });
    };

    const addRow = () => {
        setForm({ ...form, seatMap: [...form.seatMap, { row: '', category: '', seatCount: 10 }] });
    };

    const removeRow = (index) => {
        setForm({ ...form, seatMap: form.seatMap.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (editingId) {
                await api.put(`/venues/${editingId}`, form);
            } else {
                await api.post('/venues', form);
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);
            await loadVenues();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save venue');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this venue? Shows using it may be affected.')) return;
        await api.delete(`/venues/${id}`);
        await loadVenues();
    };

    const totalSeats = (seatMap) => seatMap.reduce((sum, r) => sum + (r.seatCount || 0), 0);

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Venues</h1>
                <button className="btn btn-primary" onClick={showForm ? () => setShowForm(false) : startCreate}>
                    {showForm ? 'Cancel' : '+ New venue'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
                    <div className="field">
                        <label className="label">Venue name</label>
                        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div className="field">
                        <label className="label">Address</label>
                        <input className="input" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>

                    <div className="field">
                        <label className="label">Seat rows</label>
                        {form.seatMap.map((row, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <input
                                    className="input"
                                    placeholder="Row (e.g. A)"
                                    style={{ width: 100 }}
                                    required
                                    value={row.row}
                                    onChange={(e) => updateRow(i, 'row', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Category (e.g. Premium)"
                                    required
                                    value={row.category}
                                    onChange={(e) => updateRow(i, 'category', e.target.value)}
                                />
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    placeholder="Seats"
                                    style={{ width: 90 }}
                                    required
                                    value={row.seatCount}
                                    onChange={(e) => updateRow(i, 'seatCount', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => removeRow(i)}
                                    disabled={form.seatMap.length === 1}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline" onClick={addRow}>
                            + Add row
                        </button>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button className="btn btn-primary" disabled={busy} style={{ marginTop: 8 }}>
                        {busy ? 'Saving…' : editingId ? 'Update venue' : 'Create venue'}
                    </button>
                </form>
            )}

            {venues.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>No venues yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {venues.map((v) => (
                        <div key={v._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px' }}>{v.name}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>{v.address}</p>
                                    <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {totalSeats(v.seatMap)} seats · {[...new Set(v.seatMap.map((r) => r.category))].join(', ')}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-outline" onClick={() => startEdit(v)}>
                                        Edit
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(v._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminVenues;