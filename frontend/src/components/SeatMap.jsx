import React from 'react'
import { motion } from 'framer-motion';

const seatStyle = (status, mine, selectedNow) => {
    if (status === 'booked') return 'bg-white/[0.04] border-white/[0.06] text-white/20 cursor-not-allowed';
    if (status === 'held' && !mine) return 'bg-warning/20 border-warning/40 text-warning/70 cursor-not-allowed';
    if (status === 'held' && mine) return 'bg-success/25 border-success/60 text-success shadow-[0_0_0_2px_rgba(34,197,94,0.25)]';
    if (selectedNow) return 'bg-success/25 border-success/60 text-success';
    return 'bg-white/[0.05] border-white/10 text-text-faint hover:border-white/25 hover:bg-white/[0.08]';
};

const SeatMap = ({ rows, selected, onToggleSeat, myHeldSeats }) => {
    const isSelected = (row, seatNumber) => selected.has(`${row}-${seatNumber}`);
    const isMine = (row, seatNumber) => myHeldSeats.has(`${row}-${seatNumber}`);

    // Group consecutive rows by category so we can show section labels
    const sections = [];
    let current = null;
    for (const r of rows) {
        const category = r.seats[0]?.category || '';
        if (!current || current.category !== category) {
            current = { category, rows: [] };
            sections.push(current);
        }
        current.rows.push(r);
    }

    const maxSeatsInRow = Math.max(...rows.map((r) => r.seats.length), 1);

    return (
        <div>
            {/* Curved screen */}
            <div className="flex justify-center mb-10">
                <div className="relative w-full max-w-md">
                    <svg viewBox="0 0 400 40" className="w-full">
                        <path
                            d="M 10 35 Q 200 -10 390 35"
                            fill="none"
                            stroke="url(#screenGlow)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#E50914" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#E50914" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#E50914" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <p className="text-center text-[10px] uppercase tracking-[0.3em] text-text-faint mt-1">Screen</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-5 mb-8 text-xs text-text-dim">
                <Legend swatch="bg-white/[0.05] border border-white/10" label="Available" />
                <Legend swatch="bg-success/25 border border-success/60" label="Selected / held by you" />
                <Legend swatch="bg-warning/20 border border-warning/40" label="Held by others" />
                <Legend swatch="bg-white/[0.04] border border-white/[0.06]" label="Booked" />
            </div>

            {/* Seats */}
            <div className="flex flex-col items-center gap-2.5">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="w-full flex flex-col items-center gap-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-faint mt-2 first:mt-0">
                            {section.category}
                        </span>
                        {section.rows.map((r) => {
                            const inset = (maxSeatsInRow - r.seats.length) * 15;
                            return (
                                <div key={r.row} className="flex items-center gap-2.5" style={{ paddingLeft: inset, paddingRight: inset }}>
                                    <span className="w-4 text-[11px] text-text-faint text-right">{r.row}</span>
                                    <div className="flex gap-1.5">
                                        {r.seats.map((seat, i) => {
                                            const mine = isMine(r.row, seat.seatNumber);
                                            const selectedNow = isSelected(r.row, seat.seatNumber);
                                            const clickable = seat.status === 'available' || (seat.status === 'held' && mine);
                                            // subtle arc: seats further from row center sit a touch lower
                                            const center = (r.seats.length - 1) / 2;
                                            const arcOffset = Math.abs(i - center) * 0.6;
                                            return (
                                                <motion.button
                                                    key={seat.seatNumber}
                                                    disabled={!clickable}
                                                    onClick={() => onToggleSeat(r.row, seat.seatNumber, seat.category)}
                                                    title={`${r.row}${seat.seatNumber} · ${seat.category}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.15, delay: i * 0.008 }}
                                                    whileHover={clickable ? { y: -2, scale: 1.08 } : {}}
                                                    whileTap={clickable ? { scale: 0.94 } : {}}
                                                    style={{ marginTop: arcOffset }}
                                                    className={`w-6 h-6 rounded-t-md rounded-b-[3px] border text-[9px] font-medium flex items-center justify-center transition-colors ${seatStyle(
                                                        seat.status,
                                                        mine,
                                                        selectedNow
                                                    )}`}
                                                >
                                                    {seat.seatNumber}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const Legend = ({ swatch, label }) => (
    <div className="flex items-center gap-1.5">
        <span className={`w-3.5 h-3.5 rounded ${swatch}`} />
        {label}
    </div>
);

export default SeatMap;