import React from 'react'
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 shadow-[0_0_0_1px_rgba(229,9,20,0.4)]',
    secondary: 'bg-accent-2 text-white hover:bg-accent-2/90',
    outline: 'bg-transparent border border-border text-text hover:border-white/20 hover:bg-white/[0.03]',
    ghost: 'bg-transparent text-text-dim hover:text-text hover:bg-white/[0.05]',
    danger: 'bg-error/10 text-error border border-error/30 hover:bg-error/20',
};

const sizes = {
    sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
            transition={{ duration: 0.12 }}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? <Loader2 className="animate-spin" size={16} /> : Icon ? <Icon size={16} /> : null}
            {children}
        </motion.button>
    );
};

export default Button;