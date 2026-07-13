import React from "react";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Film, Music2, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { notify } from '../lib/toast';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            notify.success('Account created');
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            setError(msg);
            notify.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
            <div className="hidden lg:flex relative overflow-hidden bg-bg-secondary items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-2/20 via-transparent to-accent/20" />
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-2/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-sm"
                >
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-accent-2/20 flex items-center justify-center">
                            <Ticket size={20} className="text-accent-2" />
                        </div>
                        <span className="font-display font-bold text-2xl">Marquee</span>
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-3 leading-tight">
                        Join the show.
                    </h2>
                    <p className="text-text-dim text-sm mb-10">
                        Book instantly as a customer, or list your own events as an organiser.
                    </p>
                    <div className="flex gap-6 text-text-faint">
                        <Film size={22} />
                        <Music2 size={22} />
                        <Clapperboard size={22} />
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center justify-center px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-sm"
                >
                    <h1 className="font-display text-2xl font-bold text-text mb-1">Create your account</h1>
                    <p className="text-text-dim text-sm mb-8">Start booking in under a minute.</p>

                    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6">
                        <Input
                            label="Name"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
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
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-text-dim mb-1.5">I want to</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'customer', label: 'Book tickets' },
                                    { value: 'organiser', label: 'Host events' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, role: opt.value })}
                                        className={`text-sm font-medium py-2.5 rounded-xl border transition-colors ${form.role === opt.value
                                                ? 'bg-accent/15 border-accent/40 text-accent'
                                                : 'border-border text-text-dim hover:text-text hover:border-white/20'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-xs text-error mb-3 -mt-1">{error}</p>}

                        <Button type="submit" loading={loading} className="w-full mt-1">
                            {loading ? 'Creating account…' : 'Sign up'}
                        </Button>
                    </form>

                    <p className="text-text-dim text-sm mt-5 text-center">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent font-medium hover:underline">
                            Log in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;