import React from 'react'
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Trash2, Calendar, MapPin, IndianRupee, Ticket, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { notify } from '../lib/toast';

const emptyForm = { title: '', type: 'movie', venueId: '', showDateTime: '', pricing: [] };

const OrganiserDashboard = () => {
    const [shows, setShows] = useState([]);
    const [venues, setVenues] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        const { data: showList } = await api.get('/organiser/shows');
        setShows(showList);

        // Pull the revenue/occupancy summary for every show up front so the
        // dashboard can show real aggregate stats + a chart, not just a list.
        const entries = await Promise.all(
            showList.map((s) => api.get(`/organiser/shows/${s._id}/summary`).then((r) => [s._id, r.data]))
        );
        setSummaries(Object.fromEntries(entries));
        setLoading(false);
    };

    useEffect(() => {
        loadAll();
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
            notify.success('Show created');
            setForm(emptyForm);
            setShowForm(false);
            await loadAll();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create show';
            setError(msg);
            notify.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteId;
        setDeleteId(null);
        await api.delete(`/shows/${id}`);
        notify.success('Show deleted');
        await loadAll();
    };

    const totalRevenue = Object.values(summaries).reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalTicketsSold = Object.values(summaries).reduce((sum, s) => sum + s.totalSeatsSold, 0);
    const totalBookings = Object.values(summaries).reduce((sum, s) => sum + s.totalBookings, 0);

    const chartData = shows.map((s) => ({
        name: s.title.length > 12 ? s.title.slice(0, 12) + '…' : s.title,
        revenue: summaries[s._id]?.totalRevenue || 0,
    }));

    return (
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-2xl font-bold text-text">Your shows</h1>
                <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'New show'}
                </Button>
            </div>

            {!loading && shows.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Stat icon={Ticket} label="Shows" value={shows.length} />
                    <Stat icon={TrendingUp} label="Bookings" value={totalBookings} />
                    <Stat icon={Ticket} label="Tickets sold" value={totalTicketsSold} />
                    <Stat icon={IndianRupee} label="Revenue" value={`₹${totalRevenue}`} accent />
                </div>
            )}

            {!loading && chartData.length > 0 && (
                <Card className="p-5 mb-8">
                    <h3 className="text-sm font-semibold text-text mb-4">Revenue by show</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                            <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                                labelStyle={{ color: '#f4f4f5' }}
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            />
                            <Bar dataKey="revenue" fill="#E50914" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {showForm && (
                <Card className="p-6 mb-8">
                    <form onSubmit={handleCreate}>
                        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-text-dim mb-1.5">Type</label>
                                <select
                                    className="w-full bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent/60"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="movie">Movie</option>
                                    <option value="concert">Concert</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-dim mb-1.5">Venue</label>
                                <select
                                    className="w-full bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent/60"
                                    required
                                    value={form.venueId}
                                    onChange={(e) => handleVenueChange(e.target.value)}
                                >
                                    <option value="">Select…</option>
                                    {venues.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Date & time"
                            type="datetime-local"
                            required
                            value={form.showDateTime}
                            onChange={(e) => setForm({ ...form, showDateTime: e.target.value })}
                        />

                        {venueCategories.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-text-dim mb-2">Pricing per category</label>
                                <div className="space-y-2">
                                    {venueCategories.map((category) => (
                                        <div key={category} className="flex items-center gap-3">
                                            <span className="w-24 text-sm text-text-dim">{category}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Price"
                                                className="flex-1 bg-bg-secondary border border-border rounded-xl px-3.5 py-2 text-sm text-text outline-none focus:border-accent/60"
                                                value={form.pricing.find((p) => p.category === category)?.price || ''}
                                                onChange={(e) => updatePrice(category, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <p className="text-xs text-error mb-3">{error}</p>}
                        <Button type="submit" loading={busy} className="w-full">
                            Create show
                        </Button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface border border-border animate-pulse" />
                    ))}
                </div>
            ) : shows.length === 0 ? (
                <p className="text-text-dim text-sm">You haven't created any shows yet.</p>
            ) : (
                <div className="space-y-3">
                    {shows.map((show) => {
                        const s = summaries[show._id];
                        return (
                            <Card key={show._id} className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-display font-semibold text-text">{show.title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-text-faint mt-1">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={11} /> {show.venue?.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} /> {new Date(show.showDateTime).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setDeleteId(show._id)} className="text-text-faint hover:text-error transition-colors p-1.5">
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                {s && (
                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                                        <MiniStat label="Bookings" value={s.totalBookings} />
                                        <MiniStat label="Seats sold" value={s.totalSeatsSold} />
                                        <MiniStat label="Revenue" value={`₹${s.totalRevenue}`} />
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete show?">
                <p className="text-sm text-text-dim mb-5">This cannot be undone.</p>
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

const Stat = ({ icon: Icon, label, value, accent }) => (
    <Card className="p-4">
        <Icon size={16} className={accent ? 'text-accent' : 'text-text-faint'} />
        <p className="text-xl font-display font-bold text-text mt-2">{value}</p>
        <p className="text-xs text-text-faint">{label}</p>
    </Card>
);

const MiniStat = ({ label, value }) => (
    <div>
        <p className="text-sm font-semibold text-text">{value}</p>
        <p className="text-[11px] text-text-faint">{label}</p>
    </div>
);

export default OrganiserDashboard;