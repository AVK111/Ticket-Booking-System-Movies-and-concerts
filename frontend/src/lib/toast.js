import React from 'react'
import toast from 'react-hot-toast';

const baseStyle = {
    background: '#18181b',
    color: '#f4f4f5',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '0.875rem',
    padding: '10px 14px',
};

export const notify = {
    success: (msg) => toast.success(msg, { style: baseStyle, iconTheme: { primary: '#22c55e', secondary: '#18181b' } }),
    error: (msg) => toast.error(msg, { style: baseStyle, iconTheme: { primary: '#ef4444', secondary: '#18181b' } }),
    info: (msg) => toast(msg, { style: baseStyle }),
};