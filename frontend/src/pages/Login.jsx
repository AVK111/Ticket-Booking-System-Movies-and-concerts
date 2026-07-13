import React from "react";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Film, Music2, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { notify } from '../lib/toast';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form);
            notify.success('Welcome back');
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            notify.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
            {/* Left — artwork panel */}
            <div className="hidden lg:flex relative overflow-hidden bg-bg-secondary items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-2/20" />
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent-2/20 blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-sm"
                >
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                            <Ticket size={20} className="text-accent" />
                        </div>
                        <span className="font-display font-bold text-2xl">Marquee</span>
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-3 leading-tight">
                        Every seat,
                        <br />
                        perfectly held.
                    </h2>
                    <p className="text-text-dim text-sm mb-10">
                        Live seat maps, instant holds, and QR tickets — for movies and concerts alike.
                    </p>
                    <div className="flex gap-6 text-text-faint">
                        <Film size={22} />
                        <Music2 size={22} />
                        <Clapperboard size={22} />
                    </div>
                </motion.div>
            </div>

            {/* Right — form panel */}
            <div className="flex items-center justify-center px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-sm"
                >
                    <h1 className="font-display text-2xl font-bold text-text mb-1">Welcome back</h1>
                    <p className="text-text-dim text-sm mb-8">Log in to continue booking.</p>

                    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6">
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Password"
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        {error && <p className="text-xs text-error mb-3 -mt-1">{error}</p>}

                        <Button type="submit" loading={loading} className="w-full mt-2">
                            {loading ? 'Logging in…' : 'Log in'}
                        </Button>
                    </form>

                    <p className="text-text-dim text-sm mt-5 text-center">
                        No account?{' '}
                        <Link to="/register" className="text-accent font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;