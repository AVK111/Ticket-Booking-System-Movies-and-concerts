import React from "react";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>Create your account</h1>

            <form onSubmit={handleSubmit} className="card">
                <div className="field">
                    <label className="label">Name</label>
                    <input
                        className="input"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                </div>

                <div className="field">
                    <label className="label">Email</label>
                    <input
                        className="input"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>

                <div className="field">
                    <label className="label">Password</label>
                    <input
                        className="input"
                        type="password"
                        required
                        minLength={6}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                <div className="field">
                    <label className="label">I want to</label>
                    <select
                        className="input"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="customer">Book tickets (Customer)</option>
                        <option value="organiser">Host events (Organiser)</option>
                    </select>
                </div>

                {error && <p className="error-text">{error}</p>}

                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Creating account…' : 'Sign up'}
                </button>
            </form>

            <p style={{ color: 'var(--text-dim)', marginTop: 16, fontSize: '0.9rem' }}>
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
};

export default Register;