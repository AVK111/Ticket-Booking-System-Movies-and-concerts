import React from 'react'
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, MapPin, Armchair } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { notify } from '../lib/toast';

const emptyForm = { name: '', address: '', seatMap: [{ row: '', category: '', seatCount: 10 }] };

const AdminVenues = () => {
    const [venues, setVenues] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    const loadVenues = async () => {
        setLoading(true);
        const { data } = await api.get('/venues');
        setVenues(data);
        setLoading(false);
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

    const addRow = () => setForm({ ...form, seatMap: [...form.seatMap, { row: '', category: '', seatCount: 10 }] });
    const removeRow = (index) => setForm({ ...form, seatMap: form.seatMap.filter((_, i) => i !== index) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (editingId) {
                await api.put(`/venues/${editingId}`, form);
                notify.success('Venue updated');
            } else {
                await api.post('/venues', form);
                notify.success('Venue created');
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);
            await loadVenues();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save venue';
            setError(msg);
            notify.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteId;
        setDeleteId(null);
        await api.delete(`/venues/${id}`);
        notify.success('Venue deleted');
        await loadVenues();
    };

    const totalSeats = (seatMap) => seatMap.reduce((sum, r) => sum + (r.seatCount || 0), 0);

    return (
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-2xl font-bold text-text">Venues</h1>
                <Button icon={Plus} onClick={showForm ? () => setShowForm(false) : startCreate}>
                    {showForm ? 'Cancel' : 'New venue'}
                </Button>
            </div>

            {showForm && (
                <Card className="p-6 mb-8">
                    <form onSubmit={handleSubmit}>
                        <Input label="Venue name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input label="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

                        <label className="block text-xs font-medium text-text-dim mb-2 mt-1">Seat rows</label>
                        <div className="space-y-2 mb-3">
                            {form.seatMap.map((row, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        className="w-20 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent/60"
                                        placeholder="Row"
                                        required
                                        value={row.row}
                                        onChange={(e) => updateRow(i, 'row', e.target.value)}
                                    />
                                    <input
                                        className="flex-1 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent/60"
                                        placeholder="Category (e.g. Premium)"
                                        required
                                        value={row.category}
                                        onChange={(e) => updateRow(i, 'category', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-24 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent/60"
                                        placeholder="Seats"
                                        required
                                        value={row.seatCount}
                                        onChange={(e) => updateRow(i, 'seatCount', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeRow(i)}
                                        disabled={form.seatMap.length === 1}
                                        className="text-text-faint hover:text-error disabled:opacity-30 p-2"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addRow} className="mb-4">
                            Add row
                        </Button>

                        {error && <p className="text-xs text-error mb-3">{error}</p>}
                        <Button type="submit" loading={busy} className="w-full">
                            {editingId ? 'Update venue' : 'Create venue'}
                        </Button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
                    ))}
                </div>
            ) : venues.length === 0 ? (
                <p className="text-text-dim text-sm">No venues yet.</p>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {venues.map((v, i) => (
                        <motion.div key={v._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <Card className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-display font-semibold text-text">{v.name}</h3>
                                        <p className="text-xs text-text-faint flex items-center gap-1 mt-0.5">
                                            <MapPin size={11} /> {v.address}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEdit(v)} className="text-text-faint hover:text-text p-1.5">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setDeleteId(v._id)} className="text-text-faint hover:text-error p-1.5">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-text-dim flex items-center gap-1.5 mt-3">
                                    <Armchair size={12} /> {totalSeats(v.seatMap)} seats · {[...new Set(v.seatMap.map((r) => r.category))].join(', ')}
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete venue?">
                <p className="text-sm text-text-dim mb-5">Shows using this venue may be affected. This cannot be undone.</p>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminVenues;