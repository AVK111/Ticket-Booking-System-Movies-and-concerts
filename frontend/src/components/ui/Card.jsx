import React from 'react'
import { motion } from 'framer-motion';

const Card = ({ children, hover = false, className = '', ...props }) => {
    const Comp = hover ? motion.div : 'div';
    const hoverProps = hover
        ? {
            whileHover: { y: -3, borderColor: 'rgba(255,255,255,0.14)' },
            transition: { duration: 0.18 },
        }
        : {};

    return (
        <Comp
            className={`bg-surface border border-border rounded-2xl shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${className}`}
            {...hoverProps}
            {...props}
        >
            {children}
        </Comp>
    );
};

export default Card;