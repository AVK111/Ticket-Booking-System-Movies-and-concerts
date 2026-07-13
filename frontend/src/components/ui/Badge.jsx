import React from 'react'
const variants = {
    neutral: 'bg-white/[0.06] text-text-dim',
    accent: 'bg-accent/15 text-accent',
    accent2: 'bg-accent-2/15 text-accent-2',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
};

const Badge = ({ children, variant = 'neutral', className = '' }) => (
    <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
        {children}
    </span>
);

export default Badge;