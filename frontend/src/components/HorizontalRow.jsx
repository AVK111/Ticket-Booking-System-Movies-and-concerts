import React from 'react'
import { motion } from 'framer-motion';
import EventCard from './EventCard';

const HorizontalRow = ({ title, shows }) => {
    if (shows.length === 0) return null;

    return (
        <div className="mb-10">
            <h2 className="text-lg font-display font-semibold text-text mb-4">{title}</h2>
            <motion.div
                className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
                {shows.map((show) => (
                    <motion.div
                        key={show._id}
                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                        className="w-64"
                    >
                        <EventCard show={show} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default HorizontalRow;