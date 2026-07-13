import React from 'react'
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Music2, MapPin, Calendar, ArrowRight } from 'lucide-react';

const typeStyle = {
    movie: {
        icon: Film,
        gradient: 'from-accent/25 via-accent/5 to-transparent',
        ring: 'group-hover:shadow-[0_0_0_1px_rgba(229,9,20,0.4),0_20px_40px_-16px_rgba(229,9,20,0.35)]',
    },
    concert: {
        icon: Music2,
        gradient: 'from-accent-2/25 via-accent-2/5 to-transparent',
        ring: 'group-hover:shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_20px_40px_-16px_rgba(139,92,246,0.35)]',
    },
};

const EventCard = ({ show, className = '' }) => {
    const style = typeStyle[show.type] || typeStyle.movie;
    const Icon = style.icon;
    const minPrice = show.pricing?.length ? Math.min(...show.pricing.map((p) => p.price)) : null;

    return (
        <Link to={`/shows/${show._id}`} className={`group block shrink-0 ${className}`}>
            <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
                className={`rounded-2xl border border-border bg-surface overflow-hidden transition-shadow duration-200 ${style.ring}`}
            >
                <div className={`relative h-44 bg-gradient-to-br ${style.gradient} bg-bg-secondary flex items-center justify-center overflow-hidden`}>
                    <Icon size={40} className="text-white/25 transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80">
                        {show.type}
                    </span>
                </div>

                <div className="p-4">
                    <h3 className="font-display font-semibold text-text text-[15px] mb-1.5 truncate">{show.title}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-text-faint mb-1">
                        <MapPin size={12} />
                        <span className="truncate">{show.venue?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-faint mb-3">
                        <Calendar size={12} />
                        <span>{new Date(show.showDateTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-sm font-semibold text-text">
                            {minPrice != null ? `From ₹${minPrice}` : '—'}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Book <ArrowRight size={12} />
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EventCard;