import React from "react";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clapperboard } from 'lucide-react';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import HorizontalRow from '../components/HorizontalRow';

const chips = [
    { value: '', label: 'All' },
    { value: 'movie', label: 'Movies' },
    { value: 'concert', label: 'Concerts' },
];

const Home = () => {
    const [shows, setShows] = useState([]);
    const [filters, setFilters] = useState({ type: '', search: '' });
    const [loading, setLoading] = useState(true);

    const fetchShows = async (overrides = {}) => {
        setLoading(true);
        const active = { ...filters, ...overrides };
        const params = {};
        if (active.type) params.type = active.type;
        if (active.search) params.search = active.search;
        const { data } = await api.get('/shows', { params });
        setShows(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchShows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChip = (value) => {
        setFilters((f) => ({ ...f, type: value }));
        fetchShows({ type: value });
    };

    const isBrowsingAll = !filters.type && !filters.search;
    const movies = shows.filter((s) => s.type === 'movie');
    const concerts = shows.filter((s) => s.type === 'concert');

    return (
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-10"
            >
                <h1 className="font-display text-4xl font-bold text-text mb-2">What's playing</h1>
                <p className="text-text-dim text-sm mb-6">Movies and concerts, seat maps updated in real time.</p>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
                        <input
                            className="w-full bg-bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:border-accent/60 transition-colors"
                            placeholder="Search title…"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && fetchShows()}
                        />
                    </div>
                    <button
                        onClick={() => fetchShows()}
                        className="text-sm font-medium bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl transition-colors"
                    >
                        Search
                    </button>
                </div>

                <div className="flex gap-2">
                    {chips.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => handleChip(c.value)}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${filters.type === c.value
                                    ? 'bg-accent/15 border-accent/40 text-accent'
                                    : 'border-border text-text-dim hover:text-text hover:border-white/20'
                                }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {loading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-surface border border-border animate-pulse" />
                    ))}
                </div>
            ) : shows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Clapperboard size={32} className="text-text-faint mb-3" />
                    <p className="text-text-dim">No shows found.</p>
                </div>
            ) : isBrowsingAll ? (
                <>
                    <HorizontalRow title="Movies" shows={movies} />
                    <HorizontalRow title="Concerts" shows={concerts} />
                </>
            ) : (
                <motion.div
                    className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                >
                    {shows.map((show) => (
                        <motion.div key={show._id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                            <EventCard show={show} className="w-full" />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default Home;