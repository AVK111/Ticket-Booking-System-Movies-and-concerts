import React from 'react'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { notify } from '../lib/toast';

const statusVariant = {
    waiting: 'neutral',
    offered: 'warning',
    converted: 'success',
    expired: 'error',
    cancelled: 'neutral',
};

const OfferCountdown = ({ expiresAt }) => {
    const [left, setLeft] = useState(Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000)));

    useEffect(() => {
        const t = setInterval(() => {
            setLeft(Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(t);
    }, [expiresAt]);

    const m = Math.floor(left / 60);
    const s = String(left % 60).padStart(2, '0');
    return (
        <span className="flex items-center gap-1 font-mono text-xs">
            <Clock size={12} /> {m}:{s}
        </span>
    );
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
            notify.success('Left the waitlist');
            await load();
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to leave waitlist');
        } finally {
            setBusyId(null);
        }
    };

    const activeOffers = entries.filter((e) => e.status === 'offered');

    return (
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
            <h1 className="font-display text-2xl font-bold text-text mb-6">My waitlist</h1>

            <AnimatePresence>
                {activeOffers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-xl px-4 py-3">
                            <Bell size={16} className="text-warning shrink-0" />
                            <p className="text-sm text-warning">
                                {activeOffers.length} seat{activeOffers.length > 1 ? 's' : ''} offered to you — complete booking before the timer runs out.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <p className="text-text-dim text-sm">You're not on any waitlists right now.</p>
            ) : (
                <div className="space-y-3">
                    {entries.map((e, i) => (
                        <motion.div key={e._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <Card className={`p-4 ${e.status === 'offered' ? 'border-warning/40' : ''}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-display font-semibold text-text">{e.show?.title}</h3>
                                        <p className="text-xs text-text-faint mt-0.5">
                                            {e.category} · {new Date(e.show?.showDateTime).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                                </div>

                                {e.status === 'offered' && (
                                    <div className="mt-3 flex items-center justify-between bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
                                        <p className="text-xs text-warning">
                                            Seat {e.offeredSeat?.row}
                                            {e.offeredSeat?.seatNumber} — <OfferCountdown expiresAt={e.offerExpiresAt} /> left
                                        </p>
                                        <Link to={`/shows/${e.show?._id}`}>
                                            <Button size="sm">
                                                Complete <ArrowRight size={13} />
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {e.status === 'waiting' && (
                                    <Button size="sm" variant="ghost" className="mt-2" disabled={busyId === e._id} onClick={() => handleLeave(e._id)}>
                                        Leave waitlist
                                    </Button>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWaitlist;