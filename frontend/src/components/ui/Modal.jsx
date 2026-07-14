import React from 'react'
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children }) => (
    <AnimatePresence>
        {open && (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
                        <button onClick={onClose} className="text-text-faint hover:text-text ml-auto">
                            <X size={18} />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default Modal;