import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Bell, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const initials = (name = '') =>
    name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const NavLink = ({ to, children }) => {
    const { pathname } = useLocation();
    const active = pathname === to;
    return (
        <Link
            to={to}
            className={`text-sm font-medium transition-colors ${active ? 'text-text' : 'text-text-dim hover:text-text'
                }`}
        >
            {children}
        </Link>
    );
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    const roleLinks = {
        customer: [
            { to: '/my-bookings', label: 'My Bookings' },
            { to: '/my-waitlist', label: 'Waitlist' },
        ],
        organiser: [{ to: '/organiser', label: 'Dashboard' }],
        admin: [{ to: '/admin/venues', label: 'Venues' }],
    };
    const links = [{ to: '/', label: 'Browse' }, ...(roleLinks[user?.role] || [])];

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
            <nav className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                        <Ticket size={16} className="text-accent" />
                    </div>
                    <span className="font-display font-bold text-lg tracking-tight">Marquee</span>
                </Link>

                <div className="hidden md:flex items-center gap-7">
                    {links.map((l) => (
                        <NavLink key={l.to} to={l.to}>
                            {l.label}
                        </NavLink>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {user && (
                        <button className="text-text-faint hover:text-text-dim transition-colors p-2 rounded-lg hover:bg-white/[0.05]">
                            <Bell size={18} />
                        </button>
                    )}

                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border hover:border-white/20 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-[11px] font-semibold">
                                    {initials(user.name)}
                                </div>
                                <ChevronDown size={14} className="text-text-faint" />
                            </button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.14 }}
                                        className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="text-sm font-medium text-text truncate">{user.name}</p>
                                            <p className="text-xs text-text-faint capitalize">{user.role}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-dim hover:bg-white/[0.05] hover:text-error transition-colors"
                                        >
                                            <LogOut size={14} />
                                            Log out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-text-dim hover:text-text px-3 py-2">
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm font-semibold bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                <button className="md:hidden text-text" onClick={() => setMobileOpen((o) => !o)}>
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </nav>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-border overflow-hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-4">
                            {links.map((l) => (
                                <Link
                                    key={l.to}
                                    to={l.to}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-sm font-medium text-text-dim hover:text-text"
                                >
                                    {l.label}
                                </Link>
                            ))}
                            {user ? (
                                <button onClick={handleLogout} className="text-left text-sm font-medium text-error">
                                    Log out ({user.name})
                                </button>
                            ) : (
                                <div className="flex gap-3 pt-2">
                                    <Link to="/login" className="text-sm font-medium text-text-dim">
                                        Log in
                                    </Link>
                                    <Link to="/register" className="text-sm font-semibold text-accent">
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;