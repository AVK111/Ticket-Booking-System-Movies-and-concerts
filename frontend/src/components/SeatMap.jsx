import React from 'react'
const statusColor = (status, isMine) => {
    if (status === 'available') return 'var(--surface-raised)';
    if (status === 'held') return isMine ? 'var(--accent)' : 'var(--held)';
    if (status === 'booked') return 'var(--booked)';
    return 'var(--surface-raised)';
};

// rows: [{ row, seats: [{ seatNumber, category, status, heldByMe? }] }]
// selected: Set of "row-seatNumber" strings the current user has clicked (not yet held)
const SeatMap = ({ rows, selected, onToggleSeat, myHeldSeats }) => {
    const isSelected = (row, seatNumber) => selected.has(`${row}-${seatNumber}`);
    const isMine = (row, seatNumber) => myHeldSeats.has(`${row}-${seatNumber}`);

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0 28px' }}>
                <div
                    style={{
                        width: '80%',
                        maxWidth: 420,
                        height: 8,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, var(--accent-dim), transparent)',
                        border: '1px solid var(--accent)',
                        borderBottom: 'none',
                    }}
                />
                <span style={{ marginTop: 8, fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>
                    SCREEN THIS WAY
                </span>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                <LegendItem color="var(--surface-raised)" label="Available" />
                <LegendItem color="var(--accent)" label="Your selection" />
                <LegendItem color="var(--held)" label="Held by others" />
                <LegendItem color="var(--booked)" label="Booked" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {rows.map(({ row, seats }) => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 20, color: 'var(--text-dim)', fontSize: '0.8rem' }}>{row}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {seats.map((seat) => {
                                const mine = isMine(row, seat.seatNumber);
                                const selectedNow = isSelected(row, seat.seatNumber);
                                const clickable = seat.status === 'available' || (seat.status === 'held' && mine);
                                return (
                                    <button
                                        key={seat.seatNumber}
                                        disabled={!clickable}
                                        onClick={() => onToggleSeat(row, seat.seatNumber, seat.category)}
                                        title={`${row}${seat.seatNumber} · ${seat.category}`}
                                        style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: 6,
                                            border: selectedNow ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            background: statusColor(seat.status, mine),
                                            color: seat.status === 'booked' || seat.status === 'held' ? '#1a1608' : 'var(--text-dim)',
                                            fontSize: '0.65rem',
                                            cursor: clickable ? 'pointer' : 'not-allowed',
                                            opacity: clickable || selectedNow ? 1 : 0.55,
                                        }}
                                    >
                                        {seat.seatNumber}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
        {label}
    </div>
);

export default SeatMap;